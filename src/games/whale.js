import {el,button,layout,session,canvas,loop,store,random,clamp} from '../core.js';
import {workbench} from '../workbench.js';
import {whaleUpgrades,whaleProfile,buyWhaleUpgrade,newWhaleRun,stepWhale,collectWhaleItem,bankWhaleRun} from './whale-rules.js';

export function whale(root){
  const scope=session(),{stage,side}=layout(root,'Tap, click or press Space to spend a doughnut and bounce. Collect doughnuts and coins, land on clouds, chain boost items, and climb into space. Rainbow doughnuts trigger Sugar Rush. Bank coins for permanent upgrades.');
  const {c,ctx}=canvas(stage,760,500),hud=el('div',{class:'scorebar'}),status=el('p',{class:'status','aria-live':'polite'}),shop=el('div'),wallet=el('p',{class:'status'}),soundButton=button('Sound: off',()=>{sound=!sound;soundButton.textContent='Sound: '+(sound?'on':'off');});
  let profile=whaleProfile(store.get('whale.profile',null)),run=newWhaleRun(profile),objects=[],spawnClock=0,camera=0,sound=false,audio=null,lastMessage='',finalized=false;
  const save=()=>store.set('whale.profile',profile);
  function tone(freq=420){if(!sound)return;try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;audio??=new Audio();audio.resume();const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.frequency.value=freq;gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.12);}catch{sound=false;}}
  function renderShop(){wallet.textContent=`BANK ${profile.coins} coins · BEST ${profile.best}`;shop.replaceChildren(...whaleUpgrades.map(item=>{const level=profile.upgrades[item.id]||0,price=item.cost*(level+1),b=button(level>=item.max?'Maxed':`Unlock · ${price} coins`,()=>{if(run.running&&!run.over){status.textContent='Finish the current run before shopping.';return;}if(buyWhaleUpgrade(profile,item.id)){save();renderShop();run=newWhaleRun(profile);objects=[];spawnClock=0;camera=0;finalized=false;}});b.disabled=level>=item.max||profile.coins<price||run.running&&!run.over;return el('div',{class:'shop-item'},[el('b',{text:`${item.name} · ${level}/${item.max}`}),el('p',{class:'hint',text:item.description}),b]);}));}
  function finish(){if(finalized)return;finalized=true;bankWhaleRun(profile,run);save();renderShop();}
  function reset(){if(run.running)finish();run=newWhaleRun(profile);objects=[];spawnClock=0;camera=0;finalized=false;renderShop();}
  const bench=workbench(root,{title:'Sky Whale movement, inventory and upgrades',source:'src/games/whale.js (drawing/input) -> src/games/whale-rules.js (physics, combos, banking)',getState:()=>({run:structuredClone(run),profile:structuredClone(profile),objects:structuredClone(objects)}),rules:{gravity:{label:'Gravity / pixels per second squared',initial:'350',help:'This is the gravity applied to the real whale. Lower it, predict fuel usage and peak altitude, then compare runs.',samples:[{}],validate:n=>Number.isFinite(n)&&n>=50&&n<=1000},bounce:{label:'Velocity after a manual bounce',initial:'velocity + 250 + level * 30',help:'velocity is current upward speed. level is your Cloud Springs upgrade. The game clamps the result to keep collisions stable.',samples:[{velocity:-200,level:0},{velocity:200,level:3}],validate:n=>Number.isFinite(n)}}});
  function tap(){if(run.over)return;const wasRunning=run.running;run.running=true;if(!wasRunning)renderShop();if(run.doughnuts<=0&&run.rush<=0){run.message='No doughnuts. Aim for clouds or collect another doughnut.';return;}if(run.rush<=0)run.doughnuts--;run.velocity=clamp(bench.run('bounce',{velocity:run.velocity,level:profile.upgrades.bounce||0}),200,620);tone(400+run.doughnuts*12);}
  scope.on(c,'pointerdown',e=>{e.preventDefault();tap();});scope.on(window,'keydown',e=>{if(e.code==='Space'&&!e.repeat&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)){e.preventDefault();tap();}});
  function spawn(){
    const kinds=['cloud','doughnut','coin','cloud','doughnut','coin','monkey','toilet','double','rainbow','scuba'];
    const kind=kinds[random(kinds.length)],height=Math.max(40,run.height-100+random(260));objects.push({x:810,height,kind,used:false});
    if(kind==='cloud')objects.push({x:855,height:height+65,kind:'doughnut',used:false});
  }
  function screenY(height){return 410-(height-camera);}
  const animation=loop(scope,dt=>{
    if(!run.running||run.over)return;
    const before=run.height;stepWhale(run,dt,bench.run('gravity',{}));camera=Math.max(0,run.height-220);spawnClock-=dt;
    if(spawnClock<=0){spawn();spawnClock=.48;}
    const speed=run.rush>0?230:150;
    for(const object of objects){
      object.x-=speed*dt;if(object.used)continue;
      if(object.kind==='cloud'){
        if(run.velocity<0&&Math.abs(object.x-160)<49&&before-18>=object.height&&run.height-18<=object.height){run.height=object.height+19;run.velocity=300+(profile.upgrades.bounce||0)*25;run.score+=25;run.doughnuts++;object.used=true;tone(550);}
      }else if(Math.hypot(object.x-160,object.height-run.height)<(32+(profile.upgrades.magnet||0)*18)){
        collectWhaleItem(run,object.kind);object.used=true;tone(object.kind==='rainbow'?900:650);
      }
    }
    objects=objects.filter(object=>object.x>-80&&!object.used);
    if(run.over)finish();
  },()=>{
    const cosmic=run.world==='Groovetopia',space=run.world==='Outer space';
    const gradient=ctx.createLinearGradient(0,0,0,500);gradient.addColorStop(0,cosmic?'#38205c':space?'#101c40':'#76b7d4');gradient.addColorStop(1,cosmic?'#a35b86':space?'#355c81':'#ecf0d9');ctx.fillStyle=gradient;ctx.fillRect(0,0,760,500);
    if(space||cosmic){ctx.fillStyle='#fff9';for(let i=0;i<65;i++){const x=((i*113-run.distance*.13)%760+760)%760,y=(i*73)%430;ctx.fillRect(x,y,i%4===0?3:1,2);}ctx.fillStyle=cosmic?'#f0b6ae':'#b8cfc3';ctx.beginPath();ctx.arc(605,95,48,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffffff70';ctx.lineWidth=10;ctx.beginPath();ctx.ellipse(605,95,75,15,-.4,0,Math.PI*2);ctx.stroke();}
    else {ctx.fillStyle='#ffffff44';for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(((i*180-run.distance*.12)%950+950)%950,65+(i%3)*60,66,19,0,0,Math.PI*2);ctx.fill();}}
    const sea=screenY(0);if(sea<500){ctx.fillStyle=run.recovery?'#2b7e9d':'#3a8da7';ctx.fillRect(0,sea,760,500-sea);ctx.strokeStyle='#d2f2e5';ctx.lineWidth=3;ctx.beginPath();for(let x=0;x<=760;x+=8){const y=sea+Math.sin((x+run.distance*3)/28)*6;if(!x)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
    const labels={doughnut:'',coin:'$',monkey:'M',toilet:'T',double:'×2',rainbow:'',scuba:'S'};
    for(const object of objects){const y=screenY(object.height);if(y<-80||y>540)continue;ctx.save();ctx.translate(object.x,y);
      if(object.kind==='cloud'){ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,8,45,12,0,0,Math.PI*2);ctx.arc(-14,0,20,0,Math.PI*2);ctx.arc(13,-2,24,0,Math.PI*2);ctx.fill();}
      else if(['doughnut','rainbow'].includes(object.kind)){ctx.strokeStyle=object.kind==='rainbow'?'#f8d366':'#ef9ba9';ctx.lineWidth=12;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.stroke();if(object.kind==='rainbow'){ctx.strokeStyle='#bde3a1';ctx.lineWidth=4;ctx.stroke();}else{ctx.fillStyle='#fdf3c3';for(let n=0;n<6;n++){const a=n*Math.PI/3;ctx.fillRect(Math.cos(a)*14-2,Math.sin(a)*14-1,4,2);}}}
      else{ctx.fillStyle=object.kind==='coin'?'#f4ce65':object.kind==='scuba'?'#91d3d5':'#d5b4df';ctx.beginPath();ctx.roundRect(-21,-21,42,42,12);ctx.fill();ctx.fillStyle='#283b41';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.fillText(labels[object.kind],0,7);}ctx.restore();
    }
    const whaleY=screenY(run.height);if(run.rush>0){for(let i=5;i>=0;i--){ctx.strokeStyle=['#f3898a','#f7b85d','#f0dc77','#b2d995','#93cbd5','#bba1d4'][i];ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,whaleY+i*6-15);ctx.quadraticCurveTo(70,whaleY+25+i*6,145,whaleY+i*3);ctx.stroke();}}
    ctx.save();ctx.translate(160,whaleY);ctx.rotate(clamp(-run.velocity/1300,-.45,.55));ctx.fillStyle='#a5a3d1';ctx.beginPath();ctx.ellipse(0,0,43,29,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-33,6);ctx.lineTo(-66,-18);ctx.lineTo(-62,12);ctx.lineTo(-40,22);ctx.fill();ctx.fillStyle='#dfd9ef';ctx.beginPath();ctx.ellipse(8,13,26,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f6e5b6';ctx.beginPath();ctx.moveTo(29,-17);ctx.lineTo(76,-30);ctx.lineTo(39,-6);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.arc(22,-8,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#243645';ctx.beginPath();ctx.arc(25,-8,4,0,Math.PI*2);ctx.fill();ctx.restore();
    if(!run.running||run.over){ctx.fillStyle='#17253bdc';ctx.beginPath();ctx.roundRect(140,170,480,130,20);ctx.fill();ctx.fillStyle='white';ctx.textAlign='center';ctx.font='900 30px Arial';ctx.fillText(run.over?'BACK TO THE SEA':'SKY WHALE',380,220);ctx.font='15px Arial';ctx.fillText(run.over?'Bank your coins. Upgrade. Go higher.':'Tap to fly. Chase doughnuts. Build a combo.',380,257);}
    hud.textContent=`${run.world.toUpperCase()} · ${Math.floor(run.distance)}m · ${run.doughnuts} DOUGHNUTS · ${run.coins} COINS${run.rush>0?' · SUGAR RUSH '+run.rush.toFixed(1)+'s':''}`;
    if(lastMessage!==run.message){lastMessage=run.message;status.textContent=run.message;}
  });
  stage.prepend(hud);stage.append(status);side.append(button('Bounce',tap,true),button('New run / bank coins',reset),button('Pause / resume',()=>animation.toggle()),soundButton,el('h3',{text:'The upgrade shop'}),wallet,shop,el('p',{class:'hint',text:'Fan-built browser version. The progression, art and balance here are our implementation; Nickelodeon’s original executable is not embedded.'}));renderShop();scope.cleanup(()=>{if(run.running)finish();audio?.close();});return()=>scope.dispose();
}
