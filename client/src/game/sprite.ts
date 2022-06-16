import * as PIXI from 'pixi.js'
import { get_player_by_id, my_id as me } from './player'
import { make_clickable,cancel_clickable } from './interaction'

const id_2_sprite:Map<string,Sprite> = new Map
const pixi_2_sprite:Map<PIXI.Sprite,Sprite> = new Map

export function get_sprite_by_id(id:string){
    return id_2_sprite.get(id)
}

export function get_sprite_by_pixi(pixi:PIXI.Sprite){
    return pixi_2_sprite.get(pixi)
}

export function for_each_sprite(func:(sprite:Sprite,id:string)=>void){
    id_2_sprite.forEach(func)
}

export function new_sprite(id:string,meta:SpriteMeta):Sprite{
    console.assert(!id_2_sprite.has(id))
    const p = new PIXI.Sprite(
        PIXI.Loader.shared.resources[meta.img].texture
        )
    const s = new Sprite(p)
    s.id = id
    s.update(meta)
    id_2_sprite.set(id,s)
    pixi_2_sprite.set(p,s)
    return s
}

export function remove_sprite(sprite:Sprite){
    id_2_sprite.delete(sprite.id)
    pixi_2_sprite.delete(sprite.pixi)
}

export function game_loop(){
    id_2_sprite.forEach((v)=>{

        const speed = v.owner==me?0.5:0.1

        v.pixi.x = v.pixi.x + (v.x-v.pixi.x)*speed
        v.pixi.y = v.pixi.y + (v.y-v.pixi.y)*speed
        if(v.owner!=me&&v.owner!='none'){
            v.pixi.alpha=0.5
        }else{
            v.pixi.alpha=1
        }
    })
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

export const status={EASY:'easy',PENDING:'pending'}

export class Sprite{
    public id:string
    public status:string = status.EASY

    public img:string
    public x:number
    public y:number
    public anchor_x:number=0.5
    public anchor_y:number=0.5
    public update_records:UpdateRecords={}
    public z_index:number=0
    public type:string

    public owner:string
    public pixi:PIXI.Sprite


    public update(data,validate_update_records=false){
        // console.log('update',data)
        if(validate_update_records){
            if(!this.compare_and_set_update_records(data['update_records'])){
                console.log('refuse')
                return
            }
        }
        for(let x in data){
            this[x] = data[x]
        }
        this.pixi.anchor.set(this['anchor_x'],this['anchor_y'])
        this.pixi.zIndex = this['z_index']
        if(this['type']=='mouse'){
            cancel_clickable(this)
        }else{
            make_clickable(this)
        }
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

    public set_owner(owner:string){
        // console.log(this.id,'set owner',owner)
        const p = get_player_by_id(this.owner)
        // console.log('player before',p)
        p?.spare_sprite(this)
        this.owner = owner
        const q = get_player_by_id(this.owner)
        // console.log('player after',q)
        if(q){
            // console.log('take')
            q.take_sprite(this)
        }
    }

    public set_z_index(z_index:number){
        this.z_index = z_index
        this.pixi.zIndex = z_index
    }

    public on(event_type:string, call_back:(any)=>any){
        this.pixi.on(event_type,call_back.bind(this))
        return this
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
        }
    }
}