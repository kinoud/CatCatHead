import { Container, Text, type Sprite as PixiSprite, MASK_TYPES} from "pixi.js";
import { OutlineFilter } from "@pixi/filter-outline";
import type { Application } from "@pixi/app"
import type { Sprite } from "../sprite";
import * as sprite from '../sprite'
import * as interact from '../interaction/interaction'
import * as menu from './operate_menu'
import { I, my_id as me} from "../player";
import type { p2d } from "../math_utils";
import {
    p2d_add,
    p2d_mul,
    p2d_rad_counterclockwise,
    rotate_vector_clockwise
} from "../math_utils"
import { NameText } from "./name_text";

console.log("display.ts")

const layers:Array<Container> = []
const which_layer:Map<Sprite,number> = new Map

export const top_z_index:Map<number,number> = new Map([[4,0],[3,0],[2,0],[1,0],[0,0]]);
export const layer_index = {SUPER:4,HIGH:3,MENU:2,MID:1,LOW:0}

const player_name_pixi:Map<string,NameText> = new Map

const visited_name_list:Set<string> = new Set

export function frame_loop(){
    

    const pv = view.pixi
    const smooth_factor = 0.5
    pv.x += (view.x-pv.x)*smooth_factor
    pv.y += (view.y-pv.y)*smooth_factor
    pv.rotation += (view.rotation-pv.rotation)*smooth_factor
    pv.scale.x += (view.scale-pv.scale.x)*smooth_factor
    pv.scale.y += (view.scale-pv.scale.y)*smooth_factor

    // 游戏刚初始化的时候mouse可能为null
    const mouse = I()?.mouse
    if(mouse){
        mouse.rotation = -view.rotation
        mouse.pixi.scale.x = 1/view.scale
        mouse.pixi.scale.y = 1/view.scale
    }

    visited_name_list.clear()

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
        if (s.type==sprite.TYPE.MOUSE){
            const name_p = player_name_pixi.get(s.owner)?.pixi
            if(name_p){
                visited_name_list.add(s.owner)
                const mouse_pos_canvas = to_canvas_position(p, true)
                const name_pos_canvas = {x: mouse_pos_canvas.x + 30, y: mouse_pos_canvas.y -30}
                const name_pos_world = to_world_position(name_pos_canvas, true)
                name_p.x = name_pos_world.x
                name_p.y = name_pos_world.y
                name_p.scale.x = 1/view.scale
                name_p.scale.y = 1/view.scale
                name_p.rotation = -view.rotation
            }
        }
    })

    for (let name of player_name_pixi.keys()){
        if (!visited_name_list.has(name)){
            remove_from_layer(player_name_pixi.get(name))
            player_name_pixi.delete(name)
        }
    }

    menu.for_each_menu(m=>{
        const p = m.pixi
        p.x = p.x + (m.x-p.x)*0.1
        p.y = p.y + (m.y-p.y)*0.1
        m.rotation = -view.rotation
        p.rotation = -view.pixi.rotation
        m.scale_x = 1/view.scale
        m.scale_y = 1/view.scale
        p.scale.x = 1/view.pixi.scale.x
        p.scale.y = 1/view.pixi.scale.y

        let alpha;
        if (m.visible) {
            alpha = 0.9;
        } else {
            alpha = 0;
        }
        
        p.alpha += (alpha-p.alpha)*0.1
    })
}

export function update_top_z_index(sprite:Sprite){
    const L = which_layer.get(sprite)
    top_z_index.set(L,Math.max(top_z_index.get(L),sprite.z_index))
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

export function register_listeners(){
    sprite.add_listener(sprite.EVENT.NEW_SPRITE,e=>{
        const s:Sprite = e.sprite
        if(s.type==sprite.TYPE.MOUSE){
            add_to_layer(layer_index.HIGH,s)
            let name_text = new NameText(s.owner)
            player_name_pixi.set(s.owner, name_text)
            add_to_layer(layer_index.HIGH, name_text)
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

    menu.add_listener(menu.EVENT.NEW_MENU,e=>{
        const m:menu.OperateMenu = e.menu
        m.visible = false
        add_to_layer(layer_index.HIGH, m)
    })

    interact.add_listener(interact.EVENT.SELECTED,e=>{
        sprite.update_sprite(e.sprite,{z_index: top_z_index.get(layer_index.MID)+1})
        outline_on(e.sprite)
    })

    interact.add_listener(interact.EVENT.UNSELECTED,e=>{
        outline_off(e.sprite)
    })
}

export function setup(pixiapp:Application){
    for(let i=0;i<5;i++){
        const L = new Container()
        L.sortableChildren = true
        layers.push(L)
        view.pixi.addChild(L)
    }
    pixiapp.stage.addChild(view.pixi)
}

const outline_filter = new OutlineFilter(2,0xffffff)

export function outline_on(sprite:Sprite){
    sprite.pixi.filters = [outline_filter]
}

export function outline_off(sprite:Sprite){
    sprite.pixi.filters = []
}

/**
 * a被b遮盖时返回true
 */
export function compare_layer_and_z_index(a:Sprite, b:Sprite):boolean{
    if (which_layer.get(a)!=which_layer.get(b)) {
        return which_layer.get(a)<which_layer.get(b);
    }
    return a.pixi.zIndex<b.pixi.zIndex;
}


interface View{
    x:number
    y:number
    rotation:number
    scale:number
    pixi:Container
}

const view:View = {x:0,y:0,rotation:0,scale:1,pixi:new Container()}

/**
 * 
 * @param pointer_wrt_canvas 
 * @param wrt_pixi pixi数据缓动过度到元数据, 因此pixi数据和元数据有一些偏差
 * @returns 
 */
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

export function to_canvas_position(world_position:p2d,wrt_pixi=false):p2d{
    const x0 = wrt_pixi?view.pixi.x:view.x
    const y0 = wrt_pixi?view.pixi.y:view.y
    const r = wrt_pixi?view.pixi.rotation:view.rotation
    const s = wrt_pixi?view.pixi.scale.x:view.scale
    let pos = p2d_mul(world_position, s)
    rotate_vector_clockwise(pos, r)
    pos = p2d_add(pos, {x:x0,y:y0})
    return pos
}

let offset_dragging:p2d

export function start_dragging_view(pointer_wrt_canvas:p2d){
    offset_dragging = {x:view.x - pointer_wrt_canvas.x,y:view.y - pointer_wrt_canvas.y}
}

export function drag_view(pointer_wrt_canvas:p2d){
    view.x = pointer_wrt_canvas.x + offset_dragging.x
    view.y = pointer_wrt_canvas.y + offset_dragging.y
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

