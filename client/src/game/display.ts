import { Container} from "pixi.js";
import { OutlineFilter } from "@pixi/filter-outline";
import type { Application } from "@pixi/app"
import type { Sprite } from "./sprite";
import * as sprite from './sprite'
import { my_id as me} from "./player";

const layers:Array<Container> = []
const which_layer:Map<Sprite,number> = new Map

export const top_z_index = {2:0,1:0,0:0}
export const layer_index = {HIGH:2,MID:1,LOW:0}

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
        pixiapp.stage.addChild(L)
    }

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
}

const outline_filter = new OutlineFilter(2,0xffffff)

export function outline_on(sprite:Sprite){
    sprite.pixi.filters = [outline_filter]
}

export function outline_off(sprite:Sprite){
    sprite.pixi.filters = []
}

export function frame_loop(){
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