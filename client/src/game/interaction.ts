import { Renderer } from "@pixi/core"
import { EventSystem, FederatedPointerEvent, FederatedWheelEvent } from "@pixi/events"
import type { Application } from "@pixi/app"
import { my_id as me, I } from "./player"
import { emit_player_update, rpc } from "./comm"
import * as sprite from './sprite'
import type {Sprite} from './sprite'
import { drag_view, layer_index, outline_off, outline_on, rotate_view_clockwise, scale_view, start_dragging_view, top_z_index, to_world_position } from "./display"
import {magnetic_offset, setup as magnetic_setup} from './magnetic'

delete Renderer.__plugins.interaction

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

export function setup(app:Application){
    app.stage.interactive = true
    app.stage.hitArea = app.renderer.screen;
    app.stage.sortableChildren = true
    const {renderer} = app

    renderer.addSystem(EventSystem, 'events')

    


    canvas_center.x = app.view.width/2
    canvas_center.y = app.view.height/2

    magnetic_setup()

    app.stage.addEventListener('pointerdown',(o)=>{
        pointerdown_handler(<FederatedPointerEvent>o)
    })

    app.stage.addEventListener('pointermove',(o)=>{
        pointermove_handler(<FederatedPointerEvent>o)
    })

    app.stage.addEventListener('pointerup',(o)=>{
        pointerup_handler(<FederatedPointerEvent>o)
    })

    app.stage.addEventListener('pointerupoutside',(o)=>{
        pointerup_handler(<FederatedPointerEvent>o)
    })

    app.stage.addEventListener('wheel',(o)=>{
        wheel_handler(<FederatedWheelEvent>o)
    },)

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

function wheel_handler(e:FederatedWheelEvent){
    console.log(e.deltaY)
    if(!e.ctrlKey){
        const rad = Math.PI/36 * (e.deltaY>0?1:-1)
        rotate_view_clockwise(canvas_center,rad)
    }else{
        const factor = 1 + (e.deltaY>0?-0.1:0.1)
        scale_view(canvas_center,factor)
    }
}

function pointerdown_handler(e:FederatedPointerEvent){
    // console.log('pointer id',e.pointerId)
    if(e.ctrlKey){
        is_dragging_view = true
        start_dragging_view(e.global)
        return
    }

    pointer.x = e.global.x
    pointer.y = e.global.y

    if(selected_sprite){
        release_selected()
    }
    const world = to_world_position(pointer)
    const s = get_topmost_clickable(world.x,world.y)

    if(s){
        sprite_pointerdown(s,world)
    }
}

function pointerup_handler(e:FederatedPointerEvent){
    // console.log('pointer id',e.pointerId)
    if(is_dragging_view){
        is_dragging_view = false
        return
    }
    sprite_pointerup()
}

function pointermove_handler(e:FederatedPointerEvent){
    // console.log('pointer id',e.pointerId)

    pointer.x = e.global.x
    pointer.y = e.global.y
    
    if(is_dragging_view){
        drag_view(e.global)
        return
    }
    
    emit_player_update()
    sprite_pointermove()
}


let dragging_sprite:Sprite = null
const dragging_offset = {x:0,y:0}

let selected_sprite:Sprite = null


interface ReleaseOwnershipArgs{
    player_id:string
    sprite_id:string
    ts:number
    sprite_data:object
}

function release_selected(){
    const s = selected_sprite
    I().critical_action(
        (ts)=>{
            trigger_event(EVENT.SELECTED_OUT,{sprite:s})
            outline_off(s)
            s.update_record = ts // to protect sprite
            sprite.update_sprite(s,{owner:'none'})
            rpc('release_ownership',<ReleaseOwnershipArgs>{
                player_id:me,sprite_id:s.id,ts:ts,
                sprite_data:s.meta
            },()=>{
                I().critical_release()
            })
            if(s==selected_sprite){
                selected_sprite = null
            }
        }
    )
}

function sprite_pointerdown(s:Sprite,world:{x:number,y:number}){
    if(s.owner!='none'&&s.owner!=me)return
    
    selected_sprite = s
    outline_on(selected_sprite)
    trigger_event(EVENT.SELECTED,{sprite:s})

    dragging_sprite = s
    dragging_offset.x = s.x-world.x
    dragging_offset.y = s.y-world.y

    sprite.update_sprite(dragging_sprite,{owner:me,z_index:top_z_index[layer_index.MID]+1})

    const ts = I().ts
    rpc('claim_ownership',{'player_id':me,'sprite_id':s.id,'ts':ts},
    (res)=>{
        if(ts<I().ts)return
        if(!res['success']){
            if(dragging_sprite==s){
                dragging_sprite = null
                sprite.update_sprite(s,{owner:'none'})
            }
        }
    })
}

function sprite_pointerup(){
    if(!dragging_sprite)return
    dragging_sprite = null
}

function sprite_pointermove(){
    if (!dragging_sprite)return
    const world = to_world_position(pointer,true)
    dragging_sprite.x = world.x + dragging_offset.x
    dragging_sprite.y = world.y + dragging_offset.y
    const offset = magnetic_offset(dragging_sprite)
    console.log('magnetic',offset)
    if(offset){
        dragging_sprite.x += offset.x
        dragging_sprite.y += offset.y
    }
}

export function rotate_selected(rad:number){
    selected_sprite.rotation += rad
}

export function flip_selected(){
    selected_sprite.scale_x *= -1
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

export const EVENT = {SELECTED_OUT:0,SELECTED:1}
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
        const bound = {x:s.pixi.x,y:s.pixi.y,w:s.pixi.width,h:s.pixi.height}

        bound.x -= bound.w*s.pixi.anchor.x
        bound.y -= bound.h*s.pixi.anchor.y

        if(x>=bound.x&&x<=bound.x+bound.w&&y>=bound.y&&y<=bound.y+bound.h){
            candidates.push(s)
        }
    })
    if(candidates.length==0)return null
    let topmost = candidates[0]
    for(let i=1;i<candidates.length;i++){
        if(candidates[i].pixi.zIndex>topmost.pixi.zIndex){
            topmost = candidates[i]
        }
    }
    return topmost
}