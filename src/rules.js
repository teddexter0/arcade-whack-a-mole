// Pure transformations: no elements, timers, storage or drawing here.
export function rpsResult(player, opponent) { return player === opponent ? 0 : (player - opponent + 3) % 3 === 1 ? 1 : -1; }
export function mergeLine(line, mergeValue = value => value * 2) {
  const values = line.filter(Boolean), result = []; let score=0;
  for(let i=0;i<values.length;i++) {
    if(values[i]===values[i+1]) { const n=mergeValue(values[i]); result.push(n);score+=n;i++; } else result.push(values[i]);
  }
  return { line: [...result,...Array(line.length-result.length).fill(0)], score };
}
export function slideGrid(grid, direction, mergeValue) {
  const n=grid.length, out=grid.map(row=>[...row]); let score=0;
  for(let a=0;a<n;a++) {
    const coords=Array.from({length:n},(_,b)=>direction==='left'?[a,b]:direction==='right'?[a,n-1-b]:direction==='up'?[b,a]:[n-1-b,a]);
    const result=mergeLine(coords.map(([r,c])=>grid[r][c]),mergeValue);score+=result.score;
    coords.forEach(([r,c],i)=>out[r][c]=result.line[i]);
  }
  return { grid:out,score,changed:JSON.stringify(out)!==JSON.stringify(grid) };
}
export function canSlide(grid) { return grid.some(row=>row.includes(0)) || ['left','right','up','down'].some(d=>slideGrid(grid,d).changed); }
export function sudokuConflicts(grid) {
  const bad=new Set();
  for(let i=0;i<81;i++) { const r=Math.floor(i/9),c=i%9,v=grid[i];if(!v)continue;
    for(let j=i+1;j<81;j++) { const rr=Math.floor(j/9),cc=j%9;if(grid[j]===v&&(r===rr||c===cc||(Math.floor(r/3)===Math.floor(rr/3)&&Math.floor(c/3)===Math.floor(cc/3)))){bad.add(i);bad.add(j);} }
  }return bad;
}
export function sudokuSolutions(grid, limit=2) {
  let count=0;
  function solve(g){ if(count>=limit)return;let chosen=-1, candidates=[];
    for(let i=0;i<81;i++)if(!g[i]){const possible=[];for(let n=1;n<=9;n++){g[i]=n;if(!sudokuConflicts(g).has(i))possible.push(n);}g[i]=0;if(!possible.length)return;if(chosen<0||possible.length<candidates.length){chosen=i;candidates=possible;if(possible.length===1)break;}}
    if(chosen<0){if(!sudokuConflicts(g).size)count++;return;}for(const n of candidates){g[chosen]=n;solve(g);if(count>=limit)break;}g[chosen]=0;
  }solve([...grid]);return count;
}
export const SHAPES = [ [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]] ];
export const rotate = matrix => matrix[0].map((_,i)=>matrix.map(row=>row[i]).reverse());
export function fits(board,piece,x,y) { return piece.every((row,r)=>row.every((v,c)=>!v||(x+c>=0&&x+c<board[0].length&&y+r>=0&&y+r<board.length&&!board[y+r][x+c]))); }
export function clearRows(board) { const kept=board.filter(row=>!row.every(Boolean));return {board:[...Array.from({length:board.length-kept.length},()=>Array(board[0].length).fill(0)),...kept],lines:board.length-kept.length}; }
export function moveBlock(blocks,id,delta,size=6) {
  const b=blocks.find(b=>b.id===id);if(!b||!Number.isInteger(delta))return blocks;
  const sign=Math.sign(delta);let moved=0;
  for(let step=0;step<Math.abs(delta);step++) { const next={...b,x:b.x+(b.axis==='h'?(moved+sign):0),y:b.y+(b.axis==='v'?(moved+sign):0)};
    const cells=Array.from({length:b.len},(_,k)=>[next.x+(b.axis==='h'?k:0),next.y+(b.axis==='v'?k:0)]);
    if(cells.some(([x,y])=>x<0||y<0||x>=size||y>=size||blocks.some(other=>other.id!==id&&Array.from({length:other.len},(_,k)=>[other.x+(other.axis==='h'?k:0),other.y+(other.axis==='v'?k:0)]).some(([xx,yy])=>xx===x&&yy===y))))break;moved+=sign;
  }return blocks.map(other=>other.id===id?{...other,x:other.x+(b.axis==='h'?moved:0),y:other.y+(b.axis==='v'?moved:0)}:other);
}
