import {celebrate,el,button,layout,session,canvas,loop,clamp,bestScore} from '../core.js';
import {assets} from '../assets.js';
import {workbench} from '../workbench.js';
export function railBounce(ball,ax,ay,bx,by,restitution=.82){
  const dx=bx-ax,dy=by-ay,t=clamp(((ball.x-ax)*dx+(ball.y-ay)*dy)/(dx*dx+dy*dy),0,1),px=ax+dx*t,py=ay+dy*t,d=Math.hypot(ball.x-px,ball.y-py);
  if(d>=ball.r+4||d===0)return false;const nx=(ball.x-px)/d,ny=(ball.y-py)/d,v=ball.vx*nx+ball.vy*ny;ball.x=px+nx*(ball.r+4);ball.y=py+ny*(ball.r+4);if(v>=0)return false;ball.vx-=(1+restitution)*v*nx;ball.vy-=(1+restitution)*v*ny;return true;
}
export function pinball(root){
  const scope=session(),{stage,side}=layout(root,'Choose a ball, then use A / Left and D / Right to hold the flippers. Space or Launch serves a ball. Launch strength and table speed are adjustable. Light all three reactors to multiply your score. Three balls, a short launch ball-save, and a readable trail.');
  stage.classList.add('pinball-stage');
  const{c,ctx}=canvas(stage,500,740),status=el('div',{class:'scorebar'}),poster=new Image();poster.src=assets.pinball;
  let ball,score=0,balls=3,waiting=true,over=false,left=false,right=false,leftAngle=.36,rightAngle=Math.PI-.36,time=0,flashes=[],particles=[],trail=[],lit=new Set(),multiplier=1,saveUntil=0,shake=0,launchAge=null,ballType='chrome',neonUntil=0;
  const speed=el('select',{'aria-label':'Table speed'},[el('option',{value:'.7',text:'Chill · 70% speed'}),el('option',{value:'1',text:'Classic · normal speed'}),el('option',{value:'1.2',text:'Arcade · fast'})]),strength=el('input',{type:'range',min:'45',max:'100',value:'70','aria-label':'Plunger strength'}),reactors=[[145,195],[355,195],[250,305]];
  const ballStyles={
    chrome:{label:'Chrome · balanced',color:'#e9f6ff',speed:720,kick:1},
    comet:{label:'Comet · fast and lively',color:'#6efcff',speed:870,kick:1.15},
    ember:{label:'Ember · heavy and steady',color:'#ff9b5a',speed:660,kick:.86}
  };
  const ballSelect=el('select',{'aria-label':'Next ball type'},Object.entries(ballStyles).map(([value,{label}])=>el('option',{value,text:label})));
  const lightTracks=[[[64,260],[105,283],[65,305],[105,328],[63,350]],[[436,260],[395,283],[435,305],[395,328],[437,350]],[[148,505],[197,475],[250,505],[303,475],[352,505]]];
  function serve(){ball={x:461,y:620,vx:0,vy:0,r:8};waiting=true;launchAge=null;trail=[];}
  let recordScore;function reset(){recordScore=bestScore('pinball',0);score=0;balls=3;over=false;multiplier=1;lit=new Set();flashes=[];particles=[];neonUntil=0;serve();}reset();
  function launch(){if(over||!waiting)return;waiting=false;ballType=ballSelect.value;launchAge=0;saveUntil=time+4;}
  const bench=workbench(root,{title:'Pinball contacts and momentum',source:'src/games/pinball.js: railBounce()',getState:()=>({ball:{...ball},score,balls,waiting,multiplier,reactors:[...lit]}),rules:{bumper:{label:'Score after a reactor hit',initial:'score + 100 * multiplier',samples:[{score:0,multiplier:1}],validate:n=>Number.isFinite(n)&&n>=0}}});
  function spark(x,y,color){flashes.push({x,y,life:1,color});for(let i=0;i<18;i++){const a=Math.random()*Math.PI*2,v=40+Math.random()*140;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.8,color});}shake=3;neonUntil=time+1.25;}
  scope.on(window,'keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(['a','ArrowLeft'].includes(e.key)){e.preventDefault();left=true;}if(['d','ArrowRight'].includes(e.key)){e.preventDefault();right=true;}if(e.code==='Space'){e.preventDefault();launch();}});scope.on(window,'keyup',e=>{if(['a','ArrowLeft'].includes(e.key))left=false;if(['d','ArrowRight'].includes(e.key))right=false;});scope.on(window,'blur',()=>{left=false;right=false;});
  const touch=el('div',{class:'touch-controls'});for(const[label,set]of[['Left flipper',v=>left=v],['Right flipper',v=>right=v]]){const b=button(label,()=>{});scope.on(b,'pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);set(true);});scope.on(b,'pointerup',()=>set(false));scope.on(b,'pointercancel',()=>set(false));touch.append(b);}stage.append(touch);
  const staticRails=[[36,90,80,40],[80,40,420,40],[420,40,466,90],[36,90,36,560],[466,90,466,655],[45,525,138,606],[455,525,362,606],[80,385,130,470],[420,385,370,470]];
  function flippers(){return[[138,620,138+92*Math.cos(leftAngle),620+92*Math.sin(leftAngle)],[362,620,362+92*Math.cos(rightAngle),620+92*Math.sin(rightAngle)]];}
  loop(scope,dt=>{
    time+=dt;shake=Math.max(0,shake-dt*20);const oldLeft=leftAngle,oldRight=rightAngle;
    leftAngle+=( (left?-.48:.36)-leftAngle)*Math.min(1,dt*22);rightAngle+=((right?Math.PI+.48:Math.PI-.36)-rightAngle)*Math.min(1,dt*22);
    for(const flash of flashes)flash.life-=dt*3;flashes=flashes.filter(f=>f.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
    if(waiting||over)return;
    const style=ballStyles[ballType];
    if(launchAge!==null){
      launchAge+=dt;
      const rise=Math.min(1,launchAge/.63),curve=clamp((launchAge-.63)/.25,0,1);
      ball.x=461-105*curve;
      ball.y=620-515*rise+18*curve*curve;
      if(curve===1){launchAge=null;ball.vx=-(205+Number(strength.value))*style.kick;ball.vy=125;}
      trail.push({x:ball.x,y:ball.y});if(trail.length>22)trail.shift();
      return;
    }
    const step=dt*Number(speed.value)/6;
    for(let sub=0;sub<6;sub++){
      ball.vy+=300*step;ball.vx*=.9998;ball.x+=ball.vx*step;ball.y+=ball.vy*step;
      for(const rail of staticRails)railBounce(ball,...rail);
      for(let i=0;i<reactors.length;i++){const[x,y]=reactors[i],dx=ball.x-x,dy=ball.y-y,d=Math.hypot(dx,dy);if(d<36&&d>0){const nx=dx/d,ny=dy/d,v=ball.vx*nx+ball.vy*ny;ball.x=x+nx*37;ball.y=y+ny*37;if(v<0){ball.vx-=1.8*v*nx;ball.vy-=1.8*v*ny;ball.vx+=nx*60*style.kick;ball.vy+=ny*60*style.kick;score=bench.run('bumper',{score,multiplier});lit.add(i);spark(x,y,['#68eaff','#ff73ca','#efd26b'][i]);if(lit.size===3){multiplier=Math.min(5,multiplier+1);lit.clear();score+=500;}}}}
      flippers().forEach((f,i)=>{if(railBounce(ball,...f,.88)){const angular=i===0?Math.abs(leftAngle-oldLeft):Math.abs(rightAngle-oldRight);if((i===0?left:right)&&angular>.002){const kick=Math.min(330,angular/Math.max(dt,.001)*25);ball.vy-=kick*style.kick;ball.vx+=(i===0?1:-1)*kick*.18;}}});
      const v=Math.hypot(ball.vx,ball.vy);if(v>style.speed){ball.vx*=style.speed/v;ball.vy*=style.speed/v;}
      if(ball.x<25){ball.x=25;ball.vx=Math.abs(ball.vx)*.8;}if(ball.x>475){ball.x=475;ball.vx=-Math.abs(ball.vx)*.8;}
      if(ball.y>750){if(time<saveUntil){serve();launch();saveUntil=0;}else{balls--;if(!balls){over=true;waiting=true;if(score>recordScore)celebrate(root,'New pinball record!');}else serve();}break;}
    }
    trail.push({x:ball.x,y:ball.y});if(trail.length>22)trail.shift();
  },()=>{
    ctx.fillStyle='#070f19';ctx.fillRect(0,0,500,740);
    const felt=ctx.createLinearGradient(35,50,465,680);
    felt.addColorStop(0,'#124654');felt.addColorStop(.58,'#092a38');felt.addColorStop(1,'#0b1829');
    ctx.fillStyle=felt;ctx.beginPath();ctx.roundRect(32,39,435,665,44);ctx.fill();ctx.save();if(shake){ctx.translate(Math.sin(time*100)*shake,Math.cos(time*80)*shake);}
    if(poster.complete&&poster.naturalWidth){ctx.globalAlpha=.18;ctx.drawImage(poster,40,60,420,600);ctx.globalAlpha=1;}
    for(let i=0;i<55;i++){const x=(i*127)%470+15,y=(i*83)%540+50;ctx.globalAlpha=.2+(Math.sin(time*1.5+i)+1)*.25;ctx.fillStyle='#d1f2ff';ctx.fillRect(x,y,2,2);}ctx.globalAlpha=1;
    const line=(coords,color,width=5,glow=14)=>{ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(coords[0],coords[1]);ctx.lineTo(coords[2],coords[3]);ctx.stroke();ctx.shadowBlur=0;};
    staticRails.forEach((rail,i)=>{line(rail,'#16222d',14,0);line(rail,i>6?'#fc63ae':'#69deff',4,13);});
    line([436,650,436,202],'#41566a',2,0);
    for(const [track,points] of lightTracks.entries()){
      for(let i=0;i<points.length-1;i++){
        const [x,y]=points[i],[nx,ny]=points[i+1];
        for(let j=0;j<4;j++){
          const u=(j+.14)/4,v=(j+.76)/4;
          const litNow=time<neonUntil&&(Math.floor((neonUntil-time)*13)+i*4+j+track)%4<2;
          line([x+(nx-x)*u,y+(ny-y)*u,x+(nx-x)*v,y+(ny-y)*v],litNow?['#70faff','#ff63e7','#ffe075'][track]:'#254855',litNow?5:3,litNow?20:0);
        }
      }
    }
    for(let i=0;i<reactors.length;i++){const[x,y]=reactors[i],pulse=(Math.sin(time*2+i)+1)/2;ctx.shadowBlur=15+pulse*14;ctx.shadowColor=['#68eaff','#ff73ca','#efd26b'][i];ctx.fillStyle=lit.has(i)?'#fafafa':'#183b50';ctx.strokeStyle=ctx.shadowColor;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,27,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='white';ctx.font='bold 15px Arial';ctx.textAlign='center';ctx.fillText(['ARC','CORE','STAR'][i],x,y+5);}
    for(const f of flippers()){line(f,'#ffe6aa',15,22);line(f,'#fff4db',7,0);}
    for(const flash of flashes){ctx.globalAlpha=flash.life;ctx.strokeStyle=flash.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(flash.x,flash.y,30+(1-flash.life)*80,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
    trail.forEach((p,i)=>{ctx.fillStyle=`rgba(130,224,255,${i/trail.length*.35})`;ctx.beginPath();ctx.arc(p.x,p.y,i/trail.length*7,0,Math.PI*2);ctx.fill();});ctx.shadowColor=ballStyles[ballType].color;ctx.shadowBlur=16;ctx.fillStyle=ballStyles[ballType].color;ctx.beginPath();ctx.arc(ball.x,ball.y,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x-2,ball.y-2,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#cae8f6';ctx.textAlign='center';ctx.font='bold 17px Arial';ctx.fillText('C I V I L   W A R',250,110);ctx.font='11px monospace';ctx.fillText('REACTOR CIRCUIT / '+multiplier+'× MULTIPLIER',250,134);
    if(waiting){ctx.fillStyle='#030d20e8';ctx.fillRect(70,395,360,90);ctx.fillStyle='white';ctx.font='bold 24px Arial';ctx.fillText(over?'TABLE COMPLETE':'LAUNCH WHEN READY',250,436);ctx.font='13px Arial';ctx.fillText(over?'Start a new table to play again.':'Space / Launch · A and D control the flippers',250,462);}ctx.restore();status.textContent=`${score} POINTS · ${balls} BALLS · ${multiplier}× · BEST ${bestScore('pinball',score)}`;
  });
  stage.prepend(status);touch.append(button('Launch ball',launch,true),ballSelect);side.append(speed,el('label',{text:'Plunger strength'},[strength]),button('New game',reset));return()=>scope.dispose();
}
