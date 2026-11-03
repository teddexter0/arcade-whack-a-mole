import {el,button,layout,session,canvas,loop,clamp,bestScore} from '../core.js';
import {workbench} from '../workbench.js';
export function parkourCourse(difficulty='normal'){
  const gap=difficulty==='hard'?120:difficulty==='easy'?55:85;let x=0;
  return Array.from({length:25},(_,i)=>{const width=i===0?300:130+(i*37%85),y=i===0?440:340+(i*41%100),platform={x,y,w:width,spike:i>1&&i%({easy:7,normal:4,hard:3}[difficulty]||4)===0,checkpoint:i%6===0};x+=width+gap;return platform;});
}
export function stickman(root){
  const scope=session(),{stage,side}=layout(root,'Parkour: A/D or Left/Right to run. Space/W/Up jumps; you have a second air jump. Shift dashes. Land on the roof, avoid spikes, and reach the final flag. Checkpoints save your position during the run.');
  const{c,ctx}=canvas(stage,960,540),status=el('div',{class:'scorebar'}),difficulty=el('select',{'aria-label':'Parkour difficulty'},['easy','normal','hard'].map(v=>el('option',{value:v,text:v})));difficulty.value='normal';
  let platforms,player,camera=0,held={left:false,right:false},lives=3,checkpoint=0,finished=false,time=0,trail=[];
  function spawn(){const p=platforms[checkpoint];player={x:p.x+25,y:p.y-50,vx:0,vy:0,jumps:2,dash:0,cooldown:0,ground:true};}
  function reset(){platforms=parkourCourse(difficulty.value);lives=3;checkpoint=0;finished=false;camera=0;trail=[];spawn();}reset();
  const bench=workbench(root,{title:'Stickman acceleration and collision',source:'src/games/stickman.js',getState:()=>({player:{...player},lives,checkpoint,finished,camera}),rules:{gravity:{label:'Gravity per frame',initial:'velocity + 1150 * dt',samples:[{velocity:0,dt:.016}],validate:n=>Number.isFinite(n)&&Math.abs(n)<5000}}});
  function jump(){if(finished||lives<=0||!player.jumps)return;player.vy=-470;player.jumps--;player.ground=false;}
  function dash(){if(player.cooldown>0||finished)return;player.dash=.16;player.cooldown=1.5;}
  scope.on(window,'keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(['a','ArrowLeft'].includes(e.key)){held.left=true;e.preventDefault();}if(['d','ArrowRight'].includes(e.key)){held.right=true;e.preventDefault();}if([' ','w','ArrowUp'].includes(e.key)&&!e.repeat){jump();e.preventDefault();}if(e.key==='Shift')dash();});scope.on(window,'keyup',e=>{if(['a','ArrowLeft'].includes(e.key))held.left=false;if(['d','ArrowRight'].includes(e.key))held.right=false;});scope.on(window,'blur',()=>{held.left=false;held.right=false;});
  const touch=el('div',{class:'touch-controls'});for(const[key,label]of[['left','Left'],['right','Right']]){const b=button(label,()=>{});b.classList.add('direction-key','direction-'+key);scope.on(b,'pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held[key]=true;});scope.on(b,'pointerup',()=>held[key]=false);scope.on(b,'pointercancel',()=>held[key]=false);touch.append(b);}touch.append(button('Jump',jump),button('Dash',dash));stage.append(touch);
  loop(scope,dt=>{
    time+=dt;if(finished||lives<=0)return;
    const oldBottom=player.y+46;player.cooldown=Math.max(0,player.cooldown-dt);player.dash=Math.max(0,player.dash-dt);player.vx=(held.right?1:0)-(held.left?1:0);player.vx*=player.dash>0?650:250;
    player.vy=player.dash>0?0:bench.run('gravity',{velocity:player.vy,dt});player.x=Math.max(0,player.x+player.vx*dt);player.y+=player.vy*dt;player.ground=false;
    for(let i=0;i<platforms.length;i++){const p=platforms[i];if(player.x+18>p.x&&player.x<p.x+p.w&&player.vy>=0&&oldBottom<=p.y+3&&player.y+46>=p.y){player.y=p.y-46;player.vy=0;player.jumps=2;player.ground=true;if(p.checkpoint)checkpoint=Math.max(checkpoint,i);}
      if(p.spike&&player.x+18>p.x+p.w/2-14&&player.x<p.x+p.w/2+14&&player.y+46>p.y-23&&player.y<p.y){lives--;spawn();break;}}
    if(player.y>650){lives--;spawn();}
    const last=platforms.at(-1);if(player.x>last.x+last.w-45){finished=true;}
    camera=Math.max(0,player.x-230);trail.push({x:player.x,y:player.y,dash:player.dash>0});if(trail.length>14)trail.shift();
  },()=>{
    ctx.fillStyle='#0c142b';ctx.fillRect(0,0,960,540);for(let layer=0;layer<3;layer++){ctx.fillStyle=['#18223b','#24314d','#2c4059'][layer];for(let i=0;i<14;i++){const x=((i*110-camera*(.15+layer*.15))%1600+1600)%1600-160,h=80+(i*43+layer*35)%150;ctx.fillRect(x,500-h,80,h);ctx.fillStyle='#f9d28b55';for(let y=510-h;y<490;y+=22)ctx.fillRect(x+12,y,7,9);ctx.fillStyle=['#18223b','#24314d','#2c4059'][layer];}}
    ctx.save();ctx.translate(-camera,0);for(const p of platforms){ctx.fillStyle='#131d2e';ctx.fillRect(p.x,p.y,p.w,25);ctx.fillStyle=p.checkpoint?'#a9e18a':'#6d9fb5';ctx.fillRect(p.x,p.y,p.w,5);ctx.fillStyle='#070c17';ctx.beginPath();ctx.moveTo(p.x+p.w,p.y);ctx.lineTo(p.x+p.w+12,p.y-9);ctx.lineTo(p.x+p.w+12,p.y+15);ctx.lineTo(p.x+p.w,p.y+25);ctx.fill();if(p.spike){ctx.fillStyle='#fa6e55';for(let i=0;i<3;i++){const x=p.x+p.w/2-20+i*14;ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(x+7,p.y-24);ctx.lineTo(x+14,p.y);ctx.fill();}}if(p.checkpoint){ctx.strokeStyle='#b9ef86';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x+15,p.y);ctx.lineTo(p.x+15,p.y-65);ctx.stroke();ctx.fillStyle='#b9ef86';ctx.fillRect(p.x+15,p.y-65,28,18);}}
    trail.forEach((p,i)=>{if(!p.dash)return;ctx.globalAlpha=i/trail.length*.25;ctx.fillStyle='#7de8ff';ctx.fillRect(p.x,p.y,18,46);});ctx.globalAlpha=1;
    const x=player.x+9,y=player.y,bob=player.ground?Math.sin(time*18)*Math.min(1,Math.abs(player.vx)/100):.6;ctx.strokeStyle=player.dash>0?'#8ce7ff':'#fff4d7';ctx.lineWidth=5;ctx.lineCap='round';ctx.shadowColor='#9cf5ff';ctx.shadowBlur=player.dash>0?20:0;ctx.beginPath();ctx.arc(x,y+7,7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+15);ctx.lineTo(x,y+30);ctx.moveTo(x,y+20);ctx.lineTo(x-12,y+26+bob*6);ctx.moveTo(x,y+20);ctx.lineTo(x+12,y+26-bob*6);ctx.moveTo(x,y+30);ctx.lineTo(x-10,y+46+bob*5);ctx.moveTo(x,y+30);ctx.lineTo(x+10,y+46-bob*5);ctx.stroke();ctx.shadowBlur=0;ctx.restore();
    status.textContent=`${lives} LIVES · CHECKPOINT ${checkpoint/6+1} · ${Math.floor(player.x)}m · DASH ${player.cooldown>0?player.cooldown.toFixed(1)+'s':'READY'} · BEST ${bestScore('stickman',Math.floor(player.x))}`;
    if(finished||lives<=0){ctx.fillStyle='#061225e8';ctx.fillRect(170,180,620,140);ctx.fillStyle='white';ctx.font='bold 32px Arial';ctx.textAlign='center';ctx.fillText(finished?'ROOFTOP RUN COMPLETE':'OUT OF LIVES',480,245);ctx.font='16px Arial';ctx.fillText('Start a new run from the controls.',480,280);}
  });
  stage.prepend(status);side.append(difficulty,button('New run',reset));return()=>scope.dispose();
}
