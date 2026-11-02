import {el,button,layout,session,random,store} from '../core.js';
import {rpsResult} from '../rules.js';
import {workbench} from '../workbench.js';

export {rps} from './rps.js';

export function mole(root){
  const scope=session(),{stage,side}=layout(root,'Whack the mole before it disappears. Click or tap; keyboard players can use 1–9. Hits: +10. Misses: −3. Rounds last 30 seconds.');
  const grid=el('div',{class:'board-grid mole-grid'}),status=el('div',{class:'status','aria-live':'polite'});let running=false,score=0,target=-1,until=0,next=0;const buttons=[];
  const bench=workbench(root,{title:'Whack-a-Mole scoring',source:'src/games/quick.js: mole()',getState:()=>({running,score,target,secondsLeft:Math.max(0,(until-performance.now())/1000)}),rules:{hit:{label:'Points after a hit',initial:'score + 10',help:'score is the current live score. Apply a different reward, then whack a mole.',samples:[{score:0},{score:100}],validate:n=>Number.isFinite(n)&&n>=0&&n<=1000000}}});
  function hit(i){if(!running)return;if(i===target){score=bench.run('hit',{score});target=-1;next=performance.now()+160;}else score=Math.max(0,score-3);render();}
  function render(){buttons.forEach((b,i)=>{b.textContent=i===target?'◉':'·';b.classList.toggle('up',i===target);b.setAttribute('aria-label',`Hole ${i+1}${i===target?', mole visible':''}`);});status.textContent=`${score} points · ${running?Math.ceil(Math.max(0,until-performance.now())/1000)+' seconds':'Ready for a round?'}`;}
  for(let i=0;i<9;i++){const b=button('·',()=>hit(i));b.className='mole';buttons.push(b);grid.append(b);}stage.append(grid,status);const start=button('Start 30-second round',()=>{score=0;running=true;until=performance.now()+30000;next=0;start.disabled=true;},true);side.append(start);
  scope.interval(()=>{if(!running)return;const now=performance.now();if(now>=until){running=false;target=-1;start.disabled=false;render();status.textContent=`Time! ${score} points. Best: ${Math.max(store.get('mole.best',0),score)}`;store.set('mole.best',Math.max(store.get('mole.best',0),score));return;}if(now>=next){target=random(9);next=now+650;}render();},40);
  scope.on(window,'keydown',e=>{if(!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&/^[1-9]$/.test(e.key))hit(Number(e.key)-1);});render();return()=>scope.dispose();
}

export {hop} from './hop.js';
