export function canvasPoint(canvas,event){
  const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/canvas.width,rect.height/canvas.height),x=(event.clientX-rect.left-(rect.width-canvas.width*scale)/2)/scale,y=(event.clientY-rect.top-(rect.height-canvas.height*scale)/2)/scale;return{x,y};
}
