export const pointer = {x:0,y:0}

export function setup(canvas){
    canvas.addEventListener('mousemove',(e)=>{
        pointer.x = e.offsetX
        pointer.y = e.offsetY
    })

    canvas.addEventListener('touchmove',(e)=>{
        pointer.x = e.targetTouches[0].pageX - canvas.offsetLeft
        pointer.y = e.targetTouches[0].pageY - canvas.offsetTop
    })
}