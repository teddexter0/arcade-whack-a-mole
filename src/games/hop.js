import {celebrate,el,button,layout,session,clamp} from '../core.js';
import {workbench} from '../workbench.js';

export function judgeJump(landings,sticks,penalty='warning',opening=false){
  if(!Array.isArray(landings)||landings.length!==3||landings.some((n,i)=>!Number.isFinite(n)||n<0||i>0&&n<=landings[i-1]))return {warnings:0,final:0,score:0,passed:false};
  const warnings=landings.slice(0,2).filter((position,i)=>position<=sticks[i]).length;
  const final=landings[2];
  return {warnings,final,score:final-(penalty==='deduct'?warnings*.5:0),passed:(opening||final>sticks[2])&&!(penalty==='fail'&&warnings>0)};
}
export function opponentPrecision(difficulty,rng=Math.random){const margin={easy:.75,medium:.4,hard:.15}[difficulty]??.4;return clamp(1-rng()*margin,0,1);}
export function hop(root){
  const scope=session(),{stage,side}=layout(root,'Two local players. Each takes a hop, step and jump from the starting line. The longest jumper in the opening round becomes the extender and places the final stick. Later jumps must land strictly beyond that stick. Tap near the meter’s 80% mark to get distance.');
  let phase=0,meter=0,time=0,active=false,target=null,round=1,turn=0,total=0,landings=[],extender=null,results=[],meterSpeed=2.5,winner=null;
  const players=['Player 1','Player 2'],sticks=[2,4],names=['HOP','STEP','JUMP'];
  const opponent=el('select',{'aria-label':'Second player'},[el('option',{value:'friend',text:'Local friend'}),...['easy','medium','hard'].map(value=>el('option',{value,text:'Simulated runner: '+value}))]);
  let simulated=false;
  stage.classList.add('hop-stage');
  const info=el('div',{class:'scorebar'}),status=el('p',{class:'status','aria-live':'polite'}),scene=el('div',{class:'jump-field'}),runner=el('div',{class:'jump-runner','aria-hidden':'true'}),meterBar=el('div',{class:'progress-fill'}),leaderboard=el('div',{class:'inspect'});
  const clouds=el('div',{class:'hop-clouds','aria-hidden':'true'},Array.from({length:4},(_,i)=>el('i',{style:'--cloud:'+i})));
  scene.append(clouds,runner);
  const pace=el('select',{'aria-label':'Meter difficulty'},['Easy','Normal','Hard'].map(v=>el('option',{value:v.toLowerCase(),text:v+' timing'})));
  pace.value='normal';
  runner.innerHTML='<svg viewBox="0 0 60 90"><circle cx="31" cy="12" r="9" fill="#262f24"/><path d="M30 26L26 48M28 32L10 40M28 32L45 24M26 48L9 71M26 48L43 63L52 79" fill="none" stroke="#262f24" stroke-width="7" stroke-linecap="round"/><path d="M30 26L26 46" stroke="#ef762a" stroke-width="11"/></svg>';
  const orangeRunner=runner.innerHTML;
  const blueRunner='<svg viewBox="0 0 60 90"><path d="M35 12Q50 8 49 33Q44 41 39 28Z" fill="#18212d"/><circle cx="31" cy="12" r="9" fill="#377ff1"/><path d="M23 13Q22 0 34 3Q42 5 40 15L35 9Z" fill="#18212d"/><path d="M28 31L10 40M28 31L45 24M26 49L9 71M26 49L43 63L52 79" fill="none" stroke="#377ff1" stroke-width="7" stroke-linecap="round"/><path d="M30 25L27 45" stroke="#141721" stroke-width="12"/><path d="M21 42L34 42L42 56L13 56Z" fill="#377ff1"/></svg>';
  const penalty=el('select',{'aria-label':'First two sticks penalty'},[el('option',{value:'warning',text:'First two sticks: warnings'}),el('option',{value:'deduct',text:'First two sticks: −0.5m each'}),el('option',{value:'fail',text:'First two sticks: fail attempt'})]);
  let bench;
  function draw(){while(scene.lastChild&&scene.lastChild!==runner)scene.lastChild.remove();if(!scene.firstChild)scene.append(runner);const visible=[0,...sticks,...(target===null?[]:[target])];for(const distance of visible)scene.append(el('div',{class:'jump-stick',text:distance.toFixed(2)+'m',style:`left:${5+distance/15*88}%`}));for(const [i,distance] of landings.entries())scene.append(el('span',{class:'hop-landing',text:names[i]+' '+distance.toFixed(1)+'m',style:'left:'+(5+distance/15*88)+'%;--landing-row:'+i}));info.textContent=`ROUND ${round} · ${players[turn]} · ${target===null?'OPENING: SET THE EXTENDER':`FINAL STICK ${target.toFixed(2)}m · ${extender}`}`;leaderboard.textContent=results.slice(-6).map(r=>`${r.player}: ${r.landings.map(n=>n.toFixed(2)).join(' → ')}m · ${r.passed?'clear':'failed'} · warnings ${r.warnings}`).join('\n')||'The first round establishes the longest jump.';}
  function landRunner(from,to,index){
    draw();
    const delta=(to-from)/15*88;
    runner.style.left=(5+to/15*88)+'%';
    runner.getAnimations?.().forEach(animation=>animation.cancel());
    const distance=scene.clientWidth*delta/100;
    if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    runner.animate([{translate:(-distance)+'px 0',rotate:'-12deg'},{translate:(-distance*.48)+'px -'+Math.round([35,48,72][index]*clamp((to-from)/3,.45,1.4))+'px',rotate:'-5deg',offset:.52},{translate:'0 0',rotate:'8deg'},{translate:'0 0',rotate:'0deg'}],{duration:[330,380,450][index],easing:'ease-out'});
  }
  function start(){runner.innerHTML=turn===1?blueRunner:orangeRunner;time=0;active=true;phase=0;total=0;landings=[];runner.style.left='5%';runner.style.removeProperty('bottom');penalty.disabled=true;opponent.disabled=true;go.textContent='Lock HOP';status.textContent=`${players[turn]}: lock three landings. Aim for 80% on the meter.`;draw();}
  function completeJump(){
    active=false;penalty.disabled=false;opponent.disabled=false;
    const result=judgeJump(landings,[...sticks,target],penalty.value,target===null),player=players[turn];results.push({...result,player,landings:[...landings],round});
    status.textContent=`${player}: ${result.passed?'CLEAR':'FAILED'} at ${total.toFixed(2)}m. ${result.warnings} early-stick ${penalty.value==='warning'?'warnings':penalty.value==='deduct'?'deductions':'fouls'}.${!result.passed&&target!==null&&total<=target?' You must land beyond the final stick; on it or short is a failed jump.':''}`;
    if(round===1){if(turn===1){const eligible=results.filter(r=>r.round===1&&r.passed);if(eligible.length){const longest=eligible.reduce((a,b)=>a.final>=b.final?a:b);target=longest.final;extender=longest.player;status.textContent+=` ${extender} is the extender and places the final stick at ${target.toFixed(2)}m.`;}else{status.textContent+=' No valid opening jump; repeat the opening round.';results=[];}}}
    else if(result.passed&&total>target){target=total;extender=player;status.textContent+=` ${player} is the extender; the final stick moves to ${target.toFixed(2)}m.`;}
    if(round>1&&!result.passed){winner=players[1-turn];celebrate(root,winner+' wins!');status.textContent+=` ${winner} wins the match.`;go.disabled=true;go.textContent='Match complete';draw();return;}
    turn=(turn+1)%2;if(turn===0&&target!==null)round++;go.textContent='Next: '+players[turn];draw();
  }
  const go=button('Start opening jump',()=>{
    if(simulated||winner!==null)return;
    if(!active&&turn===1&&opponent.value!=='friend'){
      simulated=true;start();opponent.disabled=true;go.disabled=true;players[1]='Runner ('+opponent.value+')';
      for(let i=0;i<3;i++)scope.timeout(()=>{const from=total;total+=bench.run('distance',{precision:opponentPrecision(opponent.value)});landings.push(total);phase++;landRunner(from,total,i);status.textContent=`${players[1]} ${names[i]}: ${total.toFixed(2)}m`;if(i===2){simulated=false;go.disabled=false;completeJump();}},450*(i+1));return;
    }
    if(!active){start();return;}
    const precision=clamp(1-Math.abs(meter-.8)/.8,0,1),distance=bench.run('distance',{precision});const from=total;total+=distance;landings.push(total);landRunner(from,total,phase);phase++;
    if(phase<3){go.textContent='Lock '+names[phase];status.textContent=`${names[phase-1]} landed at ${total.toFixed(2)}m. Next: ${names[phase]}.`;return;}
    completeJump();
  },true);
  stage.append(info,scene,el('p',{class:'hint',text:'HOP → STEP → JUMP · aim for 80%'}),el('div',{class:'progress-track hop-meter','aria-label':'Jump power, aim for the yellow mark'},[meterBar,el('span',{class:'hop-meter-target',text:'80%'})]),status,go,leaderboard);side.append(pace,opponent,penalty,el('p',{class:'rules',text:'Early-stick mistakes default to warnings. The final stick must be cleared. Simulated runner difficulty reduces its random error margin; no AI service or model is used.'}),button('New match',()=>{if(simulated)return;phase=0;active=false;landings=[];runner.innerHTML=orangeRunner;target=null;round=1;turn=0;extender=null;results=[];winner=null;go.disabled=false;penalty.disabled=false;opponent.disabled=false;players[1]=opponent.value==='friend'?'Player 2':'Runner ('+opponent.value+')';runner.style.left='5%';status.textContent='';go.textContent='Start opening jump';draw();}));
  bench=workbench(root,{title:'Jump distance and extender state',source:'src/games/hop.js: hop() -> judgeJump()',getState:()=>({round,player:players[turn],phase:names[phase]||'complete',landings:[...landings],target,extender,winner,results:structuredClone(results)}),rules:{distance:{label:'Distance from your timing accuracy',initial:'1.3 + precision * 2.2',help:'precision is 0 through 1. This expression sets each real landing distance in metres. Change it, predict the effect on the extender, then take a jump.',samples:[{precision:0},{precision:.5},{precision:1}],validate:n=>Number.isFinite(n)&&n>=.1&&n<=4.5,invalid:'Each hop/step/jump must return 0.1 through 4.5 metres.'}},parameters:[{label:'Timing meter speed',min:.5,max:6,step:.5,get:()=>meterSpeed,set:n=>meterSpeed=n}]});
  scope.interval(()=>{if(!active)return;time+=.016*meterSpeed*({easy:.75,normal:1,hard:1.45}[pace.value]??1)*(1+Math.min(round-1,8)*.12);meter=(Math.sin(time)+1)/2;meterBar.style.width=meter*100+'%';},16);scope.on(window,'keydown',e=>{if(e.code==='Space'&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)){e.preventDefault();go.click();}});draw();return()=>scope.dispose();
}
