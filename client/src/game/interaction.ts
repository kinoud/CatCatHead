import { Renderer } from "@pixi/core"
import { EventSystem } from "@pixi/events"
import type { Application } from "@pixi/app"
import { my_id as me, I } from "./player"
import { emit_player_update, rpc } from "./comm"
import type { Sprite } from "./sprite"
import { layer_index, outline_off, outline_on, top_z_index } from "./display"


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
        if(selected_sprite){
            release_selected()
        }
        const s = get_topmost_clickable(pointer.x,pointer.y)
        if(s){
            sprite_pointerdown(s)
        }
    })

    app.stage.addEventListener('pointermove',(e)=>{
        pointer.x = e.global.x
        pointer.y = e.global.y
        emit_player_update()
        sprite_pointermove()
    })

    app.stage.addEventListener('pointerup',(e)=>{
        sprite_pointerup()
    })

    app.stage.addEventListener('pointerupoutside',(e)=>{
        const s = get_topmost_clickable(pointer.x,pointer.y)
        if(s){
            sprite_pointerup()
        }
    })

}


let dragging_sprite:Sprite = null

let selected_sprite:Sprite = null


interface ReleaseOwnershipArgs{
    player_id:string
    sprite_id:string
    ts:number
    sprite_data:object
}

function release_selected(){
    I().critical_action(
        (ts)=>{
            outline_off(selected_sprite)
            selected_sprite.update_records[I().id] = ts // to protect sprite
            selected_sprite.set_owner('none')
            rpc('release_ownership',<ReleaseOwnershipArgs>{
                player_id:me,sprite_id:selected_sprite.id,ts:ts,
                sprite_data:selected_sprite.meta
            },()=>{
                I().critical_release()
            })
            selected_sprite = null
        }
    )
}

function sprite_pointerdown(s:Sprite){
    if(s.owner!='none'&&s.owner!=me)return
    selected_sprite = s
    outline_on(selected_sprite)

    dragging_sprite = s
    dragging_sprite.set_owner(me)
    dragging_sprite.set_z_index(top_z_index[layer_index.MID]+1)

    const ts = I().ts
    rpc('claim_ownership',{'player_id':me,'sprite_id':s.id,'ts':ts},
    (res)=>{
        if(ts<I().ts)return
        if(!res['success']){
            if(dragging_sprite==s){
                dragging_sprite = null
                s.set_owner('none')
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