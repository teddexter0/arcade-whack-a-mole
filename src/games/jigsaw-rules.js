export const puzzleTiers=[{count:100,cols:10,rows:10},{count:300,cols:20,rows:15},{count:500,cols:25,rows:20},{count:1000,cols:40,rows:25},{count:1500,cols:50,rows:30},{count:2000,cols:50,rows:40},{count:3000,cols:60,rows:50}];
export function makeJigsaw(cols,rows,seed=19){
  const sign=(a,b)=>((a*73856093^b*19349663^seed)>>>0)%2?1:-1;
  return Array.from({length:cols*rows},(_,id)=>{const x=id%cols,y=Math.floor(id/cols);return{id,x,y,edges:[y===0?0:-sign(x,y-1),x===cols-1?0:sign(x,y+1000),y===rows-1?0:sign(x,y),x===0?0:-sign(x-1,y+1000)]};});
}
export function jigsawPath(w,h,edges){
  const commands=[`M 0 0`];
  const edge=(x,y,dx,dy,sign)=>{
    const nx=dy,ny=-dx;
    const point=(t,n=0)=>`${(x+dx*t+nx*n).toFixed(3)} ${(y+dy*t+ny*n).toFixed(3)}`;
    if(!sign){commands.push('L '+point(1));return;}
    commands.push('L '+point(.32),'C '+point(.40)+' '+point(.43,-.04*sign)+' '+point(.40,.09*sign),'C '+point(.34,.27*sign)+' '+point(.66,.27*sign)+' '+point(.60,.09*sign),'C '+point(.57,-.04*sign)+' '+point(.60)+' '+point(.68),'L '+point(1));
  };
  edge(0,0,w,0,edges[0]);edge(w,0,0,h,edges[1]);edge(w,h,-w,0,edges[2]);edge(0,h,0,-h,edges[3]);commands.push('Z');return commands.join(' ');
}
export function isSnap(piece,x,y,w,h,tolerance=.42){return Math.abs(x-(piece.x+.5)*w)<=w*tolerance&&Math.abs(y-(piece.y+.5)*h)<=h*tolerance;}
