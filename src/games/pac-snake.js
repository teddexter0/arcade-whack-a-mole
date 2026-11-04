import {celebrate,el,button,layout,session,canvas,directions,loop,drawSnakeFace} from '../core.js';
import {workbench} from '../workbench.js';
export const mazeWall=(x,y)=>x<1||y<1||x>25||y>19||((y===5||y===15)&&x>4&&x<22&&x!==13)||((x===8||x===18)&&y>7&&y<13);
const vectors=[[1,0],[0,1],[-1,0],[0,-1]],same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
export function routeStep(start,target,blocked=[]){
 const queue=[[start,null]],seen=new Set([start.join(',')]),obstacles=new Set(blocked.map(p=>p.join(',')));
 for(let i=0;i<queue.length;i++){const[p,first]=queue[i];if(same(p,target))return first||[0,0];for(const d of vectors){const n=[p[0]+d[0],p[1]+d[1]],key=n.join(',');if(mazeWall(...n)||seen.has(key)||obstacles.has(key))continue;seen.add(key);queue.push([n,first||d]);}}
 return null;
}
export function pacSnake(root){
 const scope=session(),{stage,side}=layout(root,'Choose Chomper or Snake. Chomper clears pellets and can bite the blue tail while powered. Snake wins by catching Chomper three times. Neither can cross maze walls. As Snake, avoid your body; a crash costs a life. Powered Chomper can only damage the tail. Arrow keys, WASD or swipe steer. Turn through a perpendicular direction before reversing.');
 const{ctx}=canvas(stage,810,630),status=el('div',{class:'scorebar'}),role=el('select',{'aria-label':'Play as'},['chomper','snake'].map(v=>el('option',{value:v,text:'Play as '+v}))),difficulty=el('select',{'aria-label':'Maze difficulty'},['easy','normal','hard'].map(v=>el('option',{value:v,text:v})));difficulty.value='normal';
 let head,body,pellets,dir,queued,power,lives,points,elapsed,over,won,immune,turn,chomperDir;
 function reset(){head=[2,2];chomperDir=[1,0];body=[[23,17],[22,17],[21,17],[20,17],[19,17],[18,17]];dir=[1,0];queued=dir;power=0;lives=3;points=0;elapsed=0;over=false;won=false;immune=0;turn=0;pellets=[];for(let y=1;y<=19;y++)for(let x=1;x<=25;x++)if(!mazeWall(x,y))pellets.push([x,y,(x===2||x===24)&&(y===2||y===18)]);}
 reset();workbench(root,{title:'Two roles, one maze',source:'src/games/pac-snake.js: routeStep(), tick()',getState:()=>({role:role.value,head,body:structuredClone(body),pellets:pellets.length,power,lives,points,over})});
 directions(stage,scope,d=>{const next={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[d];if(!same(next,dir.map(n=>-n)))queued=next;});
 function lose(){if(immune>0)return;lives--;immune=2;head=[2,2];chomperDir=[1,0];body=[[23,17],[22,17],[21,17],[20,17],[19,17],[18,17]];dir=[1,0];queued=dir;if(lives<=0){over=true;won=role.value==='snake';}}
 function tick(){turn++;let step;
  if(role.value==='chomper'){step=!mazeWall(head[0]+queued[0],head[1]+queued[1])?queued:dir;dir=step;if(!mazeWall(head[0]+step[0],head[1]+step[1])){chomperDir=step;head=[head[0]+step[0],head[1]+step[1]];}}
  else {const target=power>0?body.at(-1):pellets.reduce((best,p)=>!best||Math.abs(p[0]-head[0])+Math.abs(p[1]-head[1])<Math.abs(best[0]-head[0])+Math.abs(best[1]-head[1])?p:best,null);step=target&&routeStep(head,target,power>0?body.slice(0,-1):body);if(step&&(step[0]||step[1])){chomperDir=step;head=[head[0]+step[0],head[1]+step[1]];}}
  const eaten=pellets.findIndex(p=>same(p,head));if(eaten>=0){const p=pellets.splice(eaten,1)[0];if(role.value==='chomper')points+=p[2]?50:10;if(p[2])power=difficulty.value==='hard'?4:7;}
  let snakeStep;
  if(role.value==='snake'){snakeStep=queued;dir=queued;}
  else {const target=power>0?[24,18]:head;snakeStep=routeStep(body[0],target,body.slice(1,-1));if(difficulty.value==='easy'&&turn%3===0)snakeStep=null;}
  if(snakeStep){const n=[body[0][0]+snakeStep[0],body[0][1]+snakeStep[1]];if(mazeWall(...n)||body.slice(0,-1).some(p=>same(p,n))){if(role.value==='snake'){lives--;body=[[23,17],[22,17],[21,17],[20,17]];dir=[1,0];queued=dir;if(lives<=0){over=true;won=false;}}}else{body.unshift(n);body.pop();}}
  const hit=body.findIndex(p=>same(p,head));if(hit>=0&&immune<=0){if(power>0&&hit===body.length-1){body.pop();points+=200;immune=.25;if(body.length<2){over=true;won=role.value==='chomper';}}else if(power<=0){if(role.value==='snake')points+=250;lose();}}
  if(!pellets.length){over=true;won=role.value==='chomper';}
 }
 loop(scope,dt=>{if(over)return;power=Math.max(0,power-dt);immune=Math.max(0,immune-dt);elapsed+=dt;const speed={easy:.16,normal:.12,hard:.085}[difficulty.value];if(elapsed>=speed){elapsed-=speed;tick();if(over&&won)celebrate(root,'You win!');}},()=>{
  ctx.fillStyle='#040b1b';ctx.fillRect(0,0,810,630);for(let y=0;y<21;y++)for(let x=0;x<27;x++)if(mazeWall(x,y)){ctx.fillStyle='#0e294a';ctx.fillRect(x*30+2,y*30+2,26,26);ctx.strokeStyle='#2e8edb';ctx.strokeRect(x*30+3,y*30+3,24,24);}
  for(const[x,y,big]of pellets){ctx.fillStyle=big?'#ff8950':'#abc0d0';ctx.beginPath();ctx.arc(x*30+15,y*30+15,big?7:2,0,7);ctx.fill();}
  body.forEach(([x,y],i)=>{ctx.shadowBlur=12;ctx.shadowColor=power>0?'#608fff':'#a4ff51';ctx.fillStyle=power>0?'#608fff':i===0?'#d9ff9b':'#76c638';ctx.beginPath();ctx.roundRect(x*30+3,y*30+3,24,24,7);ctx.fill();});ctx.shadowBlur=0;
  const [sx,sy]=body[0],[nx,ny]=body[1]||[sx-1,sy];
  drawSnakeFace(ctx,sx*30+15,sy*30+15,30,[sx-nx,sy-ny]);
  const angle=Math.atan2(chomperDir[1],chomperDir[0]);
  ctx.fillStyle=immune>0?'#fff':'#ffdc50';ctx.beginPath();ctx.moveTo(head[0]*30+15,head[1]*30+15);ctx.arc(head[0]*30+15,head[1]*30+15,12,angle+.35,angle+Math.PI*2-.35);ctx.fill();status.textContent=`${role.value.toUpperCase()} / ${difficulty.value.toUpperCase()} / ${points} POINTS / ${lives} LIVES / ${pellets.length} PELLETS / POWER ${power.toFixed(1)}s`;
  if(over){ctx.fillStyle='#07101beb';ctx.fillRect(150,250,510,110);ctx.fillStyle='white';ctx.font='bold 30px Arial';ctx.textAlign='center';ctx.fillText(won?'YOU WIN':'ROUND OVER',405,315);}
 });stage.prepend(status);scope.on(role,'change',reset);scope.on(difficulty,'change',reset);side.append(role,difficulty,button('New run',reset));return()=>scope.dispose();
}
