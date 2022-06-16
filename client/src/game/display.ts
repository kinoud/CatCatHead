import { Container, filters,Sprite as PixiSprite } from "pixi.js";
import { OutlineFilter } from "@pixi/filter-outline";
import type { Application } from "@pixi/app"
import type { Sprite } from "./sprite";

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
}

const outline_filter = new OutlineFilter(2,0xffffff)

export function outline_on(sprite:Sprite){
    sprite.pixi.filters = [outline_filter]
}

export function outline_off(sprite:Sprite){
    sprite.pixi.filters = []
}

