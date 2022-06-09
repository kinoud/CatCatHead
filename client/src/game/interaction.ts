import { Renderer } from "@pixi/core"
import { EventSystem } from "@pixi/events"
import type { Application } from "@pixi/app"
import { id_2_sprite, type Sprite } from "./sprite"
import { my_id as me, I } from "./player"
import { emit_player_update } from "./comm"
import {for_each_sprite}from './sprite'


delete Renderer.__plugins.interaction

export const pointer = {x:0,y:0}

export function setup(app:Application){
    app.stage.interactive = true
    app.stage.hitArea = app.renderer.screen;
    app.stage.sortableChildren = true
    const {renderer} = app

    renderer.addSystem(EventSystem, 'events')

    app.stage.addEventListener('pointerdown',(e)=>{
        pointer.x = e.global.x
        pointer.y = e.global.y
        const s = get_topmost_clickable(pointer.x,pointer.y)
        if(s){
            sprite_pointerdown(s)
        }
    })

    app.stage.addEventListener('pointermove',(e)=>{
        pointer.x = e.global.x
        pointer.y = e.global.y
        sprite_pointermove(e)
    })

    app.stage.addEventListener('pointerup',(e)=>{
        sprite_pointerup()
    })

    app.stage.addEventListener('pointerupoutside',(e)=>{
        const s = get_topmost_clickable(pointer.x,pointer.y)
        if(s){
            sprite_pointerup(s)
        }
    })

}


let dragging_sprite:Sprite = null

function sprite_pointerdown(s:Sprite){
    dragging_sprite = s
    dragging_sprite.set_owner(me)
    dragging_sprite.pixi.alpha = 0.5
}

function sprite_pointerup(){
    if(!dragging_sprite)return

    dragging_sprite.pixi.alpha = 1

    if(!I().sprites.has(dragging_sprite.id)){
        console.log('bug')
    }
    I().ts += 1
    console.log('before modify')
    dragging_sprite.update_records[I().id] = I().ts
    dragging_sprite.owner = 'none'
    console.log('emitting update',I().sprites)
    emit_player_update(true)
    dragging_sprite.owner = me
    dragging_sprite.set_owner('none')
    
    dragging_sprite = null
    for_each_sprite((s,_)=>{
        console.log(s.id, s.update_records)
    })
}

function sprite_pointermove(e){
    if (!dragging_sprite)return
    // console.log(pointer)
    dragging_sprite.x = pointer.x;
    dragging_sprite.y = pointer.y;
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

function get_topmost_clickable(x:number,y:number):Sprite{
    const candidates:Array<Sprite> = []
    clickable_sprites.forEach(s=>{
        let bound = s.pixi.getBounds()
        if(bound.contains(x,y)){
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