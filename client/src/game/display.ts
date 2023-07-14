import { Container} from "pixi.js";
import { OutlineFilter } from "@pixi/filter-outline";
import type { Application } from "@pixi/app"
import type { Sprite } from "./sprite";
import * as sprite from './sprite'
import * as interact from './interaction/interaction'
import { I, my_id as me} from "./player";
import type { p2d } from "./math_utils";

const layers:Array<Container> = []
const which_layer:Map<Sprite,number> = new Map

export const top_z_index = {2:0,1:0,0:0}
export const layer_index = {HIGH:2,MID:1,LOW:0}

export function frame_loop(){
    const mouse = I()?.mouse
    if(mouse){
        mouse.rotation = -view.rotation
    }

    const pv = view.pixi
    const smooth_factor = 0.5
    pv.x += (view.x-pv.x)*smooth_factor
    pv.y += (view.y-pv.y)*smooth_factor
    pv.rotation += (view.rotation-pv.rotation)*smooth_factor
    pv.scale.x += (view.scale-pv.scale.x)*smooth_factor
    pv.scale.y += (view.scale-pv.scale.y)*smooth_factor


    sprite.for_each_sprite(s=>{
        const speed = s.owner==me?0.5:0.1
        const p = s.pixi
        p.x = p.x + (s.x-p.x)*speed
        p.y = p.y + (s.y-p.y)*speed
        p.rotation = p.rotation + (s.rotation-p.rotation)*0.1
        p.scale.x = p.scale.x + (s.scale_x-p.scale.x)*0.1
        p.scale.y = p.scale.y + (s.scale_y-p.scale.y)*0.1
        if(s.owner!=me&&s.owner!='none'){
            p.alpha=0.5
        }else{
            p.alpha=1
        }
    }) 
}

export function update_top_z_index(sprite:Sprite){
    const L = which_layer.get(sprite)
    top_z_index[L] = Math.max(top_z_index[L],sprite.z_index)
}

export function add_to_layer(layer_index:number,sprite:Sprite){
    layers[layer_index].addChild(sprite.pixi)
    which_layer.set(sprite,layer_index)
}

export function remove_from_layer(sprite:Sprite){
    const layer_index = which_layer.get(sprite)
    layers[layer_index].removeChild(sprite.pixi)
    which_layer.delete(sprite)
}

export function setup(pixiapp:Application){
    for(let i=0;i<3;i++){
        const L = new Container()
        L.sortableChildren = true
        layers.push(L)
        view.pixi.addChild(L)
    }
    pixiapp.stage.addChild(view.pixi)

    sprite.add_listener(sprite.EVENT.NEW_SPRITE,e=>{
        const s:Sprite = e.sprite
        if(s.type==sprite.TYPE.MOUSE){
            add_to_layer(layer_index.HIGH,s)
        }else if(s.type==sprite.TYPE.BACKGROUND){
            add_to_layer(layer_index.LOW,s)
        }else{
            add_to_layer(layer_index.MID,s)
        }
    })

    sprite.add_listener(sprite.EVENT.REMOVE_SPRITE,e=>{
        remove_from_layer(e.sprite)
    })

    sprite.add_listener(sprite.EVENT.UPDATE_SPRITE,e=>{
        if(!e.data.z_index||!e.accept)return
        update_top_z_index(e.sprite)
    })

    interact.add_listener(interact.EVENT.SELECTED,e=>{
        sprite.update_sprite(e.sprite,{z_index: top_z_index[layer_index.MID]+1})
        outline_on(e.sprite)
    })

    interact.add_listener(interact.EVENT.UNSELECTED,e=>{
        outline_off(e.sprite)
    })
}

const outline_filter = new OutlineFilter(2,0xffffff)

export function outline_on(sprite:Sprite){
    sprite.pixi.filters = [outline_filter]
}

export function outline_off(sprite:Sprite){
    sprite.pixi.filters = []
}


interface View{
    x:number
    y:number
    rotation:number
    scale:number
    pixi:Container
}

const view:View = {x:0,y:0,rotation:0,scale:1,pixi:new Container()}


export function to_world_position(pointer_wrt_canvas:p2d,wrt_pixi=false):p2d{
    const x = pointer_wrt_canvas.x
    const y = pointer_wrt_canvas.y
    const x0 = wrt_pixi?view.pixi.x:view.x
    const y0 = wrt_pixi?view.pixi.y:view.y
    const r = wrt_pixi?view.pixi.rotation:view.rotation
    const s = wrt_pixi?view.pixi.scale.x:view.scale
    const cos = Math.cos(r)
    const sin = Math.sin(r)
    return {x:((x-x0)*cos+(y-y0)*sin)/s,y:(-(x-x0)*sin+(y-y0)*cos)/s}
}

let offset_dragging:p2d

export function start_dragging_view(pointer_wrt_canvas:p2d){
    offset_dragging = {x:view.x - pointer_wrt_canvas.x,y:view.y - pointer_wrt_canvas.y}
}

export function drag_view(pointer_wrt_canvas:p2d){
    view.x = pointer_wrt_canvas.x + offset_dragging.x
    view.y = pointer_wrt_canvas.y + offset_dragging.y
}

export function rotate_vector_clockwise(v:p2d, rad:number){
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const x = v.x*cos-v.y*sin
    const y = v.y*cos+v.x*sin
    v.x = x
    v.y = y
}

export function rotate_view_clockwise(center_wrt_canvas:p2d, delta_rad:number){
    let offset = {x:view.x-center_wrt_canvas.x,y:view.y-center_wrt_canvas.y}
    rotate_vector_clockwise(offset, delta_rad)
    view.rotation += delta_rad
    view.x = center_wrt_canvas.x + offset.x
    view.y = center_wrt_canvas.y + offset.y
}

/**
 * 双指缩放
 */

let init_scale = 1

export function start_scale_view_2(){
    init_scale = view.scale
}

export function scale_view_2(center_wrt_canvas:p2d, factor:number){
    scale_view(center_wrt_canvas, factor*init_scale/view.scale)
}

/**
 * 双指旋转
 */

let init_view_pos = {x:0,y:0};
let init_view_rotation;

export function start_rotate_view_2(){
    init_view_pos = {x:view.x, y:view.y};
    init_view_rotation = view.rotation;
}

export function rotate_view_clockwise_2(center_wrt_canvas:p2d, delta_rad:number){
    let offset = {x:init_view_pos.x-center_wrt_canvas.x,y:init_view_pos.y-center_wrt_canvas.y}
    rotate_vector_clockwise(offset, delta_rad)
    view.rotation = init_view_rotation + delta_rad
    view.x = center_wrt_canvas.x + offset.x
    view.y = center_wrt_canvas.y + offset.y
}

/**
 * 把view.rotation四舍五入到rad_mod的整数倍
 * @param rad_mod 
 */
export function round_view_rotation(center_wrt_canvas:p2d, rad_mod:number){
    let dest_rotation = Math.round(view.rotation/rad_mod)*rad_mod
    rotate_view_clockwise(center_wrt_canvas, (dest_rotation-view.rotation)%(Math.PI*2))
}

export function scale_view(center_wrt_canvas:p2d, factor:number){
    let offset = {x:view.x-center_wrt_canvas.x,
        y:view.y-center_wrt_canvas.y}
    offset.x *= factor
    offset.y *= factor
    view.scale *= factor
    view.x = center_wrt_canvas.x + offset.x
    view.y = center_wrt_canvas.y + offset.y
}

