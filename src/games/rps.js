import {celebrate,el,button,layout,session,random,gameTime} from '../core.js';
import {rpsResult} from '../rules.js';
import {workbench} from '../workbench.js';
export function rps(root){
  const scope=session(),{stage,side}=layout(root,'Choose Rock, Paper or Scissors at any time before the result. Start the four-beat count. You can change your hand during SHOOT’s final 0.5 seconds. If no hand is selected at the deadline, your choice is random. Keys 1, 2 and 3 also work.');
  let phase=-1,selection=null,opponent=null,deadline=0,windowMs=500,wins=0,losses=0,round=0,ready=true;
  const beat=el('div',{class:'rps-stage',text:'CHOOSE YOUR HAND'}),hands=el('div',{class:'rps-hands',text:'✊  ⚡  ✊'}),arena=el('div',{class:'rps-arena'},[beat,hands]),choices=el('div',{class:'rps-choices'}),status=el('p',{class:'status','aria-live':'polite',text:'The three buttons below are ready. Pick one, then start.'}),stats=el('div',{class:'scorebar'}),fill=el('div',{class:'progress-fill'});
  const names=['Rock','Paper','Scissors'],icons=['✊','✋','✌'];let buttons=[];
  function render(){buttons.forEach((b,i)=>{b.classList.toggle('chosen',i===selection);b.setAttribute('aria-pressed',i===selection);});stats.textContent=`ROUND ${round} · YOU ${wins} / RANDOM ${losses}`;}
  function finish(){if(phase!==3)return;const automatic=selection===null,p=automatic?random(3):selection,outcome=rpsResult(p,opponent);phase=4;round++;if(outcome===1){wins++;celebrate(root,'You win!');}if(outcome===-1)losses++;hands.textContent=`${icons[p]}  ⚡  ${icons[opponent]}`;beat.textContent=outcome===0?'DRAW':outcome===1?'YOU WIN':'NEXT ROUND';status.textContent=(automatic?'No hand selected: randomised. ':'Your choice locked in. ')+ 'Pick your next hand whenever you’re ready.';pulse(true);selection=null;ready=true;start.disabled=false;fill.style.width='0%';render();}
  function pulse(shoot=false){
    if(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    hands.animate([{transform:"scale(.84) translateY(14px)",opacity:.65},{transform:"scale(1.12) translateY(-9px)",opacity:1},{transform:"scale(1) translateY(0)"}],{duration:shoot?460:560,easing:"cubic-bezier(.18,.75,.22,1)"});
  }
  function choose(i){if(phase===3&&gameTime()>=deadline){finish();return;}selection=i;status.textContent=`${names[i]} selected.${phase===3?' Final selection window!':' You can change it before the deadline.'}`;render();}
  buttons=names.map((name,i)=>{const b=button(`${icons[i]} ${name} · ${i+1}`,()=>choose(i));b.className='rps-choice';b.setAttribute('aria-label',name);choices.append(b);return b;});
  const start=button('Start: Rock → Paper → Scissors → Shoot',()=>{if(!ready)return;ready=false;phase=0;opponent=random(3);start.disabled=true;beat.textContent='ROCK';hands.textContent='✊  ⚡  ✊';pulse();for(let i=1;i<=3;i++)scope.timeout(()=>{phase=i;beat.textContent=['ROCK','PAPER','SCISSORS','SHOOT!'][i];pulse(i===3);if(i===3){deadline=gameTime()+windowMs;status.textContent='SHOOT! Change your choice now, or let it lock.';scope.timeout(finish,windowMs);}},i*650);},true);
  stage.append(stats,arena,el('div',{class:'progress-track'},[fill]),choices,status,start);side.append(el('p',{class:'notice',text:'Solo showdown. Your opponent chooses randomly. Preselect your hand, then change it right up to the deadline.'}));
  scope.interval(()=>{if(phase===3){fill.style.width=Math.max(0,(deadline-gameTime())/windowMs*100)+'%';if(gameTime()>=deadline)finish();}},16);
  scope.on(window,'keydown',e=>{if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&/^[1-3]$/.test(e.key))choose(Number(e.key)-1);});
  workbench(root,{title:'RPS timing and state',source:'src/games/rps.js -> src/rules.js',getState:()=>({phase,selection,opponent:phase===4?opponent:'hidden',deadline,wins,losses,round}),parameters:[{label:'Final choice window / milliseconds',min:100,max:2000,step:100,get:()=>windowMs,set:n=>{if(!ready)throw Error('Wait for the round to finish.');windowMs=n;}}]});render();return()=>scope.dispose();
}
