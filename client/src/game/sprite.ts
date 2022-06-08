import * as PIXI from 'pixi.js'
import { get_player_by_id, I, my_id as me } from './player'
import { emit_player_update } from './comm'

const sprite_pool:Map<string,Sprite> = new Map

export function get_sprite_by_id(id:string){
    return sprite_pool.get(id)
}

export function for_each_sprite(func:(sprite:Sprite,id:string)=>void){
    sprite_pool.forEach(func)
}

export function new_sprite(id:string,meta:SpriteMeta):Sprite{
    console.assert(!sprite_pool.has(id))
    const p = new PIXI.Sprite(
        PIXI.Loader.shared.resources[meta.img].texture
        )
    const s = new Sprite(p)
    s.id = id
    s.update(meta)
    s.pixi = p
    sprite_pool.set(id,s)
    return s
}

export function remove_sprite(id:string){
    sprite_pool.delete(id)
}

export function game_loop(){
    sprite_pool.forEach((v,k)=>{

        const speed = v.owner==me?0.5:0.1

        v.pixi.x = v.pixi.x + (v.x-v.pixi.x)*speed
        v.pixi.y = v.pixi.y + (v.y-v.pixi.y)*speed
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

export class Sprite{
    public id:string
    public status:string = 'easy'

    public img:string
    public x:number
    public y:number
    public anchor_x:number=0.5
    public anchor_y:number=0.5
    public update_records:UpdateRecords

    public owner:string
    public pixi:PIXI.Sprite

    private event_data
    private dragging:boolean=false


    public update(data,validate_update_records=false){
        if(validate_update_records){
            if(!this.compare_and_set_update_records(data['update_records'])){
                console.log('refuse')
                return
            }
        }
        for(let x in data){
            this[x] = data[x]
        }
        this.pixi.anchor.set(data['anchor_x'],data['anchor_y'])
        if(this.owner=='none'){
            this.pixi.interactive = true
        }else{
            this.pixi.interactive = false
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
        for(let p in update_records){
            this.update_records[p] = update_records[p]
        }
        return true
    }

    constructor(pixi:PIXI.Sprite){
        this.pixi = pixi
        this.pixi.interactive = true
        this.pixi.on('pointerdown',this.on_pointerdown.bind(this))
        this.pixi.on('pointermove',this.on_pointermove.bind(this))
        this.pixi.on('pointerup',this.on_pointerup.bind(this))
        this.pixi.on('pointerupoutside',this.on_pointerup.bind(this))
    }

    private on_pointerdown(event){
        this.set_owner(me)
        this.event_data = event.data;
        this.pixi.alpha = 0.5;
        this.dragging = true;
    }

    private on_pointermove(){
        if (this.dragging) {
            const newPosition = this.event_data.getLocalPosition(this.pixi.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
        }
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

    private on_pointerup(){
        this.pixi.alpha = 1;
        this.dragging = false;
        // set the interaction data to null
        this.event_data = null;
        if(!I().sprites.has(this.id)){
            console.log('bug')
        }
        const p = get_player_by_id(this.owner)
        p.ts += 1
        this.update_records[p.id] = p.ts
        this.owner = 'none'
        emit_player_update(true)
        this.owner = me
        this.set_owner('none')
        console.log('emit update',I().sprites)
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
            owner:this.owner
        }
    }
}