import { Renderer } from "@pixi/core"
import { EventSystem, FederatedPointerEvent, FederatedWheelEvent } from "@pixi/events"
import type { Application } from "@pixi/app"
import { my_id as me, I } from "../player"
import { emit_player_update, rpc } from "../comm"
import * as sprite from '../sprite'
import type {Sprite} from '../sprite'
import { drag_view, layer_index, outline_off, outline_on, rotate_view_clockwise, scale_view, start_dragging_view, top_z_index, to_world_position, compare_layer_and_z_index } from "../display/display"
import {magnetic_offset, setup as magnetic_setup} from '../magnetic'
import {print_log} from '../game'
import {setup as touch_setup, TOUCHACTION, get_current_action, touch_to_pointer} from './touch'
import { get_menu_by_id, new_menu, type OperateMenu } from "../display/operate_menu"

console.log("interaction.ts")

delete Renderer.__plugins.interaction

export const EVENT = {SELECTED_OUT:0,SELECTED:1,UNSELECTED:0}
// 鼠标的世界坐标
const pointer = {x:0,y:0}

export function frame_loop(){
    const mouse = I()?.mouse
    if(mouse){
        const world = to_world_position(pointer,true)
        mouse.x = world.x
        mouse.y = world.y
        mouse.pixi.x = world.x
        mouse.pixi.y = world.y
    }
}

let is_dragging_view:boolean = false

const canvas_center = {x:0,y:0}
let canvas:HTMLCanvasElement

const MENU_SPRITE_OPERATION = "menu_sprite_operation"

export function register_listeners(){
    sprite.add_listener(sprite.EVENT.NEW_SPRITE,e=>{
        const s:Sprite = e.sprite
        console.log('new sprite',s.type)
        if(s.type==sprite.TYPE.MOUSE || s.type==sprite.TYPE.BACKGROUND){
            cancel_clickable(s)
        }else{
            make_clickable(s)
        }
    })
}

export function setup(app:Application){

    app.view.addEventListener('mousedown',pointerdown_handler)
    app.view.addEventListener('mouseup',pointerup_handler)
    app.view.addEventListener('mousemove',pointermove_handler)
    app.view.addEventListener('mouseleave',pointerup_handler)
    app.view.addEventListener('touchstart',touchstart_handler)
    app.view.addEventListener('touchend',touchend_handler)
    app.view.addEventListener('touchmove',touchmove_handler)
    app.view.addEventListener('touchcancel',touchcancel_handler)

    app.stage.addEventListener('wheel',(o)=>{
        wheel_handler(<FederatedWheelEvent>o)
    },)
    app.stage.interactive = true
    app.stage.hitArea = app.renderer.screen;
    app.stage.sortableChildren = true
    const {renderer} = app

    renderer.addSystem(EventSystem, 'events')

    canvas_center.x = app.view.width/2
    canvas_center.y = app.view.height/2

    magnetic_setup()
    canvas = app.view

    
    let menu_sprite_operation = new_menu(MENU_SPRITE_OPERATION)
    menu_sprite_operation.add_callback("↶",()=>{rotate_selected(-Math.PI/2)})
    menu_sprite_operation.add_callback("↷",()=>{rotate_selected(Math.PI/2)})
    menu_sprite_operation.add_callback("⇄",()=>{flip_selected()})

    touch_setup(app)

}

function wheel_handler(e:FederatedWheelEvent){
    if(e.ctrlKey){
        const factor = 1 + (e.deltaY>0?-0.1:0.1)
        scale_view(canvas_center,factor)
    }else{
        const rad = Math.PI/36 * (e.deltaY>0?1:-1)
        rotate_view_clockwise(pointer,rad)
    }
}

export interface MyPointerEvent{
    ctrlKey: boolean
    offsetX: number
    offsetY:number
}

function pointerdown_handler(e:MouseEvent|MyPointerEvent){

    const offset = {x:e.offsetX,y:e.offsetY}
    pointer.x = offset.x
    pointer.y = offset.y
    const world = to_world_position(pointer)
    const s = get_topmost_clickable(world.x,world.y)

    if(e.ctrlKey||s==null){
        is_dragging_view = true
        start_dragging_view(offset)
    }

    const menu = get_menu_by_id(MENU_SPRITE_OPERATION)

    if (s==menu) {
        menu.click(world.x - menu.x, world.y - menu.y, {selected_sprites: selected_sprites})
        return
    } else {
        menu.visible = false
        cancel_clickable(menu)
        unselect_all_sprites()
    }
    
    if(s){
        sprite_pointerdown(s,world)
        const menu = get_menu_by_id(MENU_SPRITE_OPERATION)
        menu.visible = true
        const menu_world_pos = to_world_position({x:pointer.x+30,y:pointer.y+30},true)
        menu.x = menu_world_pos.x
        menu.y = menu_world_pos.y
        make_clickable(menu)
    }
}

function pointerup_handler(e:MouseEvent|MyPointerEvent){

    if(is_dragging_view){
        is_dragging_view = false
        return
    }
    sprite_pointerup()

}

function pointermove_handler(e:MouseEvent|MyPointerEvent){

    if(get_current_action()!=TOUCHACTION.NONE){
        sprite_pointerup()
    }

    const offset = {x:e.offsetX,y:e.offsetY}

    pointer.x = offset.x
    pointer.y = offset.y
    
    if(is_dragging_view){
        drag_view(offset)
        return
    }
    
    emit_player_update()
    sprite_pointermove()
}



function touchstart_handler(e:TouchEvent){
    print_log('(i) touchstart '+e.targetTouches.length)
    if(e.targetTouches.length==1){
        pointerdown_handler(touch_to_pointer(e.targetTouches[0]))
    }else{
        sprite_pointerup()
        unselect_all_sprites()
        pointermove_handler(touch_to_pointer(e.targetTouches[0]))
    }
}

function touchmove_handler(e:TouchEvent){
    pointermove_handler(touch_to_pointer(e.targetTouches[0]))
}

function touchend_handler(e:TouchEvent){
    if(e.targetTouches.length==0){
        pointerup_handler(touch_to_pointer(e.changedTouches[0]))
    }
}

function touchcancel_handler(e:TouchEvent){
    touchend_handler(e)
}


export const dragging_sprites:Set<Sprite> = new Set
export const dragging_offset = {x:0,y:0}
export const selected_sprites:Set<Sprite> = new Set

/**
 * make a sprite selected in the view of the client.
 * this function will trigger "EVENT.SELECTED".
 * @param s 
 */
export function select_sprite(s:Sprite){
    trigger_event(EVENT.SELECTED, {sprite:s})
    selected_sprites.add(s)
}

/**
 * make a sprite unselected in the view of the client.
 * trigger "EVENT.SELECTED_OUT".
 * @param s 
 */
export function unselect_sprite(s:Sprite){
    trigger_event(EVENT.SELECTED_OUT, {sprite:s})
    selected_sprites.delete(s)
}

export function unselect_all_sprites(){
    const arr:Array<Sprite> = []
    selected_sprites.forEach(s=>{arr.push(s)})
    arr.forEach(s=>{unselect_sprite(s)})
}

function sprite_pointerdown(s:Sprite,world:{x:number,y:number}){
    if(s.owner!='none'&&s.owner!=me)return
    dragging_sprites.add(s)
    dragging_offset.x = s.x-world.x
    dragging_offset.y = s.y-world.y
    select_sprite(s)
}

function sprite_pointerup(){
    dragging_sprites.clear()
}

function sprite_pointermove(){
    if (dragging_sprites.size==0)return
    const world = to_world_position(pointer,true)
    let one:Sprite
    dragging_sprites.forEach(s=>{
        s.x = world.x + dragging_offset.x
        s.y = world.y + dragging_offset.y
        one = s
    })
    const menu = get_menu_by_id(MENU_SPRITE_OPERATION)
    const menu_world_pos = to_world_position({x:pointer.x+30,y:pointer.y+30},true)
    menu.x = menu_world_pos.x
    menu.y = menu_world_pos.y
    
    let offset = null
    if(dragging_sprites.size==1){
        offset = magnetic_offset(one)
    }
    
    if(offset){
        dragging_sprites.forEach(s=>{
            s.x += offset.x
            s.y += offset.y
        })
    }
}

export function rotate_selected(rad:number){
    selected_sprites.forEach(s=>{
        s.rotation += rad
    })
}

export function flip_selected(){
    selected_sprites.forEach(s=>{
        s.scale_x *= -1
    })
}


const clickable_sprites:Set<Sprite> = new Set


export function make_clickable(s:Sprite){
    if(clickable_sprites.has(s))return

    clickable_sprites.add(s)
}

export function cancel_clickable(s:Sprite){
    if(!clickable_sprites.has(s))return

    clickable_sprites.delete(s)
}


interface Listeners{
    [event:string|number]:Array<Function>
}

const listeners:Listeners = {}

export function add_listener(event_type:string|number,func:Function){
    if(!listeners[event_type]){
        listeners[event_type] = []
    }
    listeners[event_type].push(func)
}

function trigger_event(event_type:string|number,e={}){
    listeners[event_type]?.forEach((f)=>{f(e)})
}

function get_topmost_clickable(x:number,y:number):Sprite{
    const candidates:Array<Sprite> = []
    clickable_sprites.forEach(s=>{
        const local_bound = s.pixi.getLocalBounds()
        const bound = {x:s.pixi.x,y:s.pixi.y,w:local_bound.width,h:local_bound.height}
        bound.x -= bound.w*s.pixi.anchor.x
        bound.y -= bound.h*s.pixi.anchor.y

        if(x>=bound.x&&x<=bound.x+bound.w&&y>=bound.y&&y<=bound.y+bound.h){
            candidates.push(s)
        }
    })
    if(candidates.length==0)return null
    let topmost = candidates[0]
    for(let i=1;i<candidates.length;i++){
        if (compare_layer_and_z_index(topmost, candidates[i])){
            topmost = candidates[i]
        }
    }
    return topmost
}