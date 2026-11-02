import {unblockLevels} from '../data/unblock-levels.js';
import {el,button,layout,session,directions,random,store,bestScore} from '../core.js';
import {slideGrid,canSlide,sudokuConflicts,sudokuSolutions,moveBlock} from '../rules.js';
import {workbench} from '../workbench.js';

export function merge(root) {
  const scope=session(),{stage,side}=layout(root,'Slide with arrow keys, WASD, swipe, or buttons. Equal numbers combine, each tile merges once per move, and a new coloured number tile appears after a valid move. A full board ends the run only when no compatible neighbours remain. Your “2042” reference uses this 2048 merge mechanic.');
  const score=el('div',{class:'scorebar'}),gridEl=el('div',{class:'board-grid merge-grid'}),status=el('p',{class:'status','aria-live':'polite'});
  let grid,points,history=[],won=false;function spawn(){const empty=[];grid.forEach((row,r)=>row.forEach((v,c)=>{if(!v)empty.push([r,c]);}));if(empty.length){const[r,c]=empty[random(empty.length)];grid[r][c]=Math.random()<.9?2:4;}}
  function render(){gridEl.replaceChildren(...grid.flat().map(v=>el('div',{class:'cell',text:v||'',style:`background:${v?`hsl(${43-Math.log2(v)*4} 78% ${92-Math.log2(v)*4}%)`:'#d4d8c8'};color:${v>=128?'white':'#252c23'}`})));score.textContent=`SCORE ${points} / BEST ${bestScore('merge',points)}`;if(!canSlide(grid))status.textContent='No moves left. Start a new board.';else if(grid.flat().includes(2048)&&!won){won=true;status.textContent='2048! Keep going if you want.';}store.set('merge',{grid,points,won});}
  function reset(){grid=Array.from({length:4},()=>Array(4).fill(0));points=0;won=false;history=[];status.textContent='';spawn();spawn();render();}
  const saved=store.get('merge',null);if(saved&&Array.isArray(saved.grid)&&saved.grid.length===4&&saved.grid.every(r=>Array.isArray(r)&&r.length===4&&r.every(v=>Number.isInteger(v)&&v>=0))){({grid,points,won}=saved);}else reset();
  const bench=workbench(root,{title:'Tile merge',source:'src/games/puzzles.js: merge() -> src/rules.js: slideGrid() -> mergeLine()',getState:()=>({grid:structuredClone(grid),points,canMove:canSlide(grid),history:history.length}),rules:{merged:{label:'The value of a merged pair',initial:'value * 2',help:'value is one of the equal input tiles. This expression sets the actual output tile, not an example beside the game. Try value * 4, then play a pair and inspect the board.',samples:[{value:2},{value:4},{value:8}],validate:v=>Number.isFinite(v)&&v>0&&Number.isInteger(Math.log2(v))&&v<=1048576,invalid:'Return a positive power of two up to 1,048,576.'}}});
  stage.append(score,gridEl,status);directions(stage,scope,dir=>{const result=slideGrid(grid,dir,value=>bench.run('merged',{value}));if(!result.changed)return;history.push({grid,points,won});grid=result.grid;points+=result.score;spawn();render();});
  side.append(button('New board',reset),button('Undo move',()=>{const last=history.pop();if(last){({grid,points,won}=last);status.textContent='';render();}}));render();return()=>scope.dispose();
}

const basePuzzle='530070000600195000098000060800060003400803001700020006060000280000419005000080079';
export function sudoku(root){
  const {stage,side}=layout(root,'Fill each row, column and 3×3 box with 1–9. Red marks show conflicts. The given numbers cannot be changed. Each generated puzzle is checked for one solution.');
  const gridEl=el('div',{class:'board-grid sudoku'}),status=el('p',{class:'status','aria-live':'polite'}),level=el('select',{'aria-label':'Sudoku difficulty'},['Easy','Medium','Hard'].map(v=>el('option',{text:v})));
  let givens=[],grid=[],bench;function render(){gridEl.replaceChildren(...grid.map((v,i)=>el('input',{type:'text',inputmode:'numeric',maxlength:'1',value:v||'','aria-label':`Row ${Math.floor(i/9)+1}, column ${i%9+1}`,class:givens[i]?'given':'',...(givens[i]?{readonly:''}:{}),onInput:e=>{const n=Number(e.target.value.replace(/[^1-9]/g,''));grid[i]=n&&bench.run('allowed',{value:n})?n:0;e.target.value=grid[i]||'';check();save();}})));check();}
  function save(){store.set('sudoku',{grid,givens});}
  function check(){const bad=sudokuConflicts(grid);[...gridEl.children].forEach((cell,i)=>cell.classList.toggle('conflict',bad.has(i)));status.textContent=bad.size?`${bad.size} conflicting cells. Follow the row, column and box.`:grid.every(Boolean)?'Solved. Every unit is valid.':`${grid.filter(Boolean).length} / 81 filled · no conflicts`;}
  function generate(){const digits=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5);givens=basePuzzle.split('').map(n=>n==='0'?0:digits[Number(n)-1]);
    // A fixed valid solution transformed with the same digit permutation.
    const solution='534678912672195348198342567859761423426853791713924856961537284287419635345286179'.split('').map(n=>digits[Number(n)-1]);
    if(level.value==='Easy'){let add=10;for(let i=0;i<81&&add;i++)if(!givens[i]){givens[i]=solution[i];add--;}}
    if(level.value==='Hard'){for(const i of Array.from({length:81},(_,i)=>i).sort(()=>Math.random()-.5)){if(!givens[i])continue;const v=givens[i];givens[i]=0;if(sudokuSolutions(givens)!==1)givens[i]=v;}}
    grid=[...givens];render();save();}
  const saved=store.get('sudoku',null);if(saved&&saved.grid?.length===81&&saved.givens?.length===81&&[...saved.grid,...saved.givens].every(v=>Number.isInteger(v)&&v>=0&&v<=9)){grid=saved.grid;givens=saved.givens;}else generate();
  bench=workbench(root,{title:'Sudoku input and constraints',source:'src/games/puzzles.js: sudoku() -> src/rules.js: sudokuConflicts(), sudokuSolutions()',getState:()=>({grid:[...grid],givens:[...givens],conflicts:[...sudokuConflicts(grid)]}),rules:{allowed:{label:'Accept a typed digit',initial:'value >= 1 && value <= 9',help:'value is the typed digit. Try value <= 8, predict which input stops working, then type into a real blank cell. Restore the rule before solving.',samples:[{value:1},{value:9}],validate:v=>typeof v==='boolean'}}});
  stage.append(gridEl,status);side.append(level,button('New puzzle',generate),button('Clear my entries',()=>{grid=[...givens];render();save();}));render();return()=>{};
}

export function pop(root){
  const{stage,side}=layout(root,'Pop connected groups of at least two same-colour tiles. Gravity pulls tiles down and empty columns close up. You have 20 moves; aim for 1,500 points. Larger groups score more.');
  const board=el('div',{class:'board-grid',style:'grid-template-columns:repeat(8,1fr)'}),status=el('div',{class:'status','aria-live':'polite'});let grid,score,moves;const colors=['#ee8a4a','#9fbde0','#b4ce71','#bdacd5'];
  const bench=workbench(root,{title:'Puzzle Pop group scoring',source:'src/games/puzzles.js: pop() -> group() -> gravity compaction',getState:()=>({grid:[...grid],score,moves}),rules:{reward:{label:'Points for a popped group',initial:'count * count * 5',help:'count is the actual number of connected tiles you pop. Compare linear versus squared rewards while playing.',samples:[{count:2},{count:6}],validate:n=>Number.isFinite(n)&&n>=0&&n<=1000000}}});
  function group(i){const todo=[i],seen=new Set(),v=grid[i];while(todo.length){const n=todo.pop();if(seen.has(n)||grid[n]!==v||v===null)continue;seen.add(n);const r=Math.floor(n/8),c=n%8;for(const [rr,cc]of[[r-1,c],[r+1,c],[r,c-1],[r,c+1]])if(rr>=0&&rr<8&&cc>=0&&cc<8)todo.push(rr*8+cc);}return [...seen];}
  function render(){const possible=grid.some((v,i)=>v!==null&&group(i).length>1);board.replaceChildren(...grid.map((v,i)=>el('button',{class:'cell',style:`background:${v===null?'transparent':colors[v]}`,text:v===null?'':['●','◆','■','✦'][v],'aria-label':v===null?'Empty':`Colour ${v+1}, row ${Math.floor(i/8)+1}, column ${i%8+1}`,onClick:()=>{if(!moves||!possible)return;const selected=group(i);if(selected.length<2)return;selected.forEach(n=>grid[n]=null);score+=bench.run('reward',{count:selected.length});moves--;let columns=[];for(let c=0;c<8;c++){const col=Array.from({length:8},(_,r)=>grid[r*8+c]).filter(v=>v!==null);if(col.length)columns.push([...Array(8-col.length).fill(null),...col]);}while(columns.length<8)columns.push(Array(8).fill(null));grid=Array.from({length:64},(_,i)=>columns[i%8][Math.floor(i/8)]);render();}})));status.textContent=`${score} points · ${moves} moves${!moves||!possible?score>=1500?' · Target cleared!':' · Round over. Try again.':''}`;bestScore('pop',score);}
  function reset(){grid=Array.from({length:64},()=>random(4));score=0;moves=20;render();}stage.append(board,status);side.append(button('New round',reset));reset();return()=>{};
}

export function unblock(root){
  const scope=session(),{stage,side}=layout(root,'Slide blocks along their own axis. Get orange X to the right-hand exit on row 3. Drag a block, or select it and use arrows. Undo is unlimited.');
  const board=el('div',{class:'unblock-board',role:'group','aria-label':'Six by six sliding block puzzle'}),status=el('p',{class:'status'});let blocks,selected='X',history=[],moves=0,drag;
  const levels=el('select',{'aria-label':'Unblock puzzle difficulty'},unblockLevels.map((p,i)=>el('option',{value:i,text:`${i<3?'Warm-up':i<6?'Hard':'Expert'} ${i+1} · minimum ${p.minimum} slides` })));
  function reset(){blocks=structuredClone(unblockLevels[Number(levels.value)||0].blocks);selected='X';history=[];moves=0;render();}
  scope.on(levels,'change',reset);
  workbench(root,{title:'Unblock movement and collision',source:'src/games/puzzles.js: unblock() -> src/rules.js: moveBlock()',getState:()=>({blocks:structuredClone(blocks),selected,moves,undoDepth:history.length})});
  function render(){board.replaceChildren(...blocks.map(b=>el('button',{class:`block ${b.id==='X'?'target':''} ${selected===b.id?'selected':''}`,text:b.id,'aria-label':`Block ${b.id}, ${b.axis==='h'?'horizontal':'vertical'}`,style:`left:${b.x/6*100}%;top:${b.y/6*100}%;width:${(b.axis==='h'?b.len:1)/6*100}%;height:${(b.axis==='v'?b.len:1)/6*100}%`,onPointerdown:e=>{selected=b.id;drag={id:b.id,x:e.clientX,y:e.clientY};e.preventDefault();board.setPointerCapture(e.pointerId);},onClick:()=>{selected=b.id;render();}})));status.textContent=blocks.find(b=>b.id==='X').x===4?`Exit clear! Solved in ${moves} moves.`:`${moves} moves · selected ${selected}`;}
  function move(delta){const next=moveBlock(blocks,selected,delta);if(JSON.stringify(next)===JSON.stringify(blocks))return;history.push(blocks);blocks=next;moves++;render();}
  scope.on(board,'pointerup',e=>{if(!drag)return;const b=blocks.find(b=>b.id===drag.id);selected=drag.id;const delta=Math.round((b.axis==='h'?e.clientX-drag.x:e.clientY-drag.y)/(board.clientWidth/6));drag=null;move(delta);render();});scope.on(board,'pointercancel',()=>drag=null);
  directions(stage,scope,dir=>{const b=blocks.find(b=>b.id===selected);if((b.axis==='h'&&['left','right'].includes(dir))||(b.axis==='v'&&['up','down'].includes(dir)))move(['left','up'].includes(dir)?-1:1);});
  stage.prepend(board,status);side.append(levels,button('Reset puzzle',reset),button('Undo',()=>{if(history.length){blocks=history.pop();moves--;render();}}));reset();return()=>scope.dispose();
}
