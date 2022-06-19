import * as PIXI from 'pixi.js'
import { my_id as me } from './player'
import { TextureCache } from '@pixi/utils'

export const TYPE = {BACKGROUND:'background',MOUSE:'mouse'}

const id_2_sprite:Map<string,Sprite> = new Map
const pixi_2_sprite:Map<PIXI.Sprite,Sprite> = new Map

export function get_sprite_by_id(id:string){
    return id_2_sprite.get(id)
}

export function get_sprite_by_pixi(pixi:PIXI.Sprite){
    return pixi_2_sprite.get(pixi)
}

export function for_each_sprite(func:(sprite:Sprite)=>void){
    id_2_sprite.forEach(func)
}

export function new_sprite(id:string,meta:SpriteMeta):Sprite{
    console.assert(!id_2_sprite.has(id))
    const p = new PIXI.Sprite(
        TextureCache[meta.img]
        )
    const s = new Sprite(p)
    s.id = id
    s.update(meta)
    id_2_sprite.set(id,s)
    pixi_2_sprite.set(p,s)
    trigger_event(EVENT.NEW_SPRITE,{sprite:s})
    return s
}

export function remove_sprite(sprite:Sprite){
    id_2_sprite.delete(sprite.id)
    pixi_2_sprite.delete(sprite.pixi)
    trigger_event(EVENT.REMOVE_SPRITE,{sprite:sprite})
}

export function update_sprite(sprite:Sprite,data,validate_update_records=false){
    const original_data = sprite.meta
    const accept = sprite.update(data,validate_update_records)
    trigger_event(EVENT.UPDATE_SPRITE,
        {sprite:sprite,accept:accept,original_data:original_data,data:data,validate_update_records:validate_update_records})
}

export interface SpriteMeta{
    x:string,
    y:string,
    owner:string,
    img:string
}

interface UpdateRecords{
    [player_id:string]:number
}

export class Sprite{
    public id:string

    public img:string
    public x:number
    public y:number
    public anchor_x:number=0.5
    public anchor_y:number=0.5
    public update_records:UpdateRecords={}
    public z_index:number=0
    public type:string
    public rotation:number=0
    public scale_x:number=1
    public scale_y:number=1
    public owner:string
    public pixi:PIXI.Sprite


    public update(data,validate_update_records=false){
        // console.log('update',data)
        if(validate_update_records){
            if(!this.compare_and_set_update_records(data['update_records'])){
                console.log('refuse')
                return false
            }
        }
        for(let x in data){
            this[x] = data[x]
        }
        this.pixi.anchor.set(this['anchor_x'],this['anchor_y'])
        this.pixi.zIndex = this['z_index']
        return true
    }

    /**
     * 
     * @param update_records we assume update_records has every online player's entry
     * @returns 
     */
    public compare_and_set_update_records(update_records:UpdateRecords){
        for(let p in update_records){
            if(p in this.update_records && this.update_records[p]>update_records[p]){
                return false
            }
        }
        if(!(me in update_records)&&(me in this.update_records))return false
        for(let p in update_records){
            this.update_records[p] = update_records[p]
        }
        return true
    }

    constructor(pixi:PIXI.Sprite){
        this.pixi = pixi
    }


    get meta(){
        return {
            img: this.img,
            x:this.x,
            y:this.y,
            anchor_x:this.anchor_x,
            anchor_y:this.anchor_y,
            owner:this.owner,
            z_index:this.z_index,
            rotation:this.rotation,
            scale_x:this.scale_x,
            scale_y:this.scale_y
        }
    }
}


export const EVENT = {NEW_SPRITE:0,UPDATE_SPRITE:1,REMOVE_SPRITE:2}

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
    listeners[event_type]?.forEach(f=>{f(e)})
}