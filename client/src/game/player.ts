import type { Sprite } from "./sprite"
import { get_sprite_by_id } from "./sprite"

const players:Map<string,Player> = new Map

export var my_id:string

export function set_player(id:string){
    my_id = id
}

export class Player{
    id:string
    public sprites:Map<string,Sprite> = new Map
    public mouse_sprite_id:string
    private token:number=0
    private token_locked:boolean=false
    private critical_tries:number=0

    constructor(id:string, mouse_sprite_id:string){
        this.id = id
        this.mouse_sprite_id = mouse_sprite_id
    }

    get ts(){
        return this.token
    }

    public critical_release(){
        console.log('release critical')
        this.token_locked=false
    }

    public critical_action(action:(ts:number)=>void){
        if(this.token_locked){
            console.log('ts locked!')
            this.critical_tries += 1
            if(this.critical_tries>10){
                console.log('critical abort!')
                this.token_locked = false
                return
            }
            setTimeout(() => {
                this.critical_action(action)   
            }, 50);
            return
        }
        this.critical_tries = 0
        this.token_locked = true
        console.log('doing critical',this)
        this.token += 1
        action(this.token)
    }

    public update(o){
        for(let key in o){
            this[key] = o[key]
        }
    }

    public spare_sprite(s:Sprite){
        this.sprites.delete(s.id)
    }

    public take_sprite(s:Sprite){
        this.sprites.set(s.id,s)
        // console.log('taken',this.sprites)
    }

    get mouse(){
        return get_sprite_by_id(this.mouse_sprite_id)
    }

    get meta(){
        const o = {
            mouse_sprite_id: this.mouse_sprite_id,
            ts: this.ts
        }
        return o
    }

    get info(){
        let out = this.id + ': '
        out += '['+this.mouse_sprite_id+']'
        this.sprites.forEach((s,_)=>{
            if(s.id!=this.mouse_sprite_id)
                out += ','+s.id
        })
        return out
    }
}

export function I(){
    if(!my_id)return undefined
    return players.get(my_id)
}

export function new_player(id, mouse_sprite_id){
    const p = new Player(id,mouse_sprite_id)
    players.set(id, p)
    return p
}

export function remove_player(id:string){
    players.delete(id)
}

export function get_player_by_id(id:string){
    return players.get(id)
}

export function for_each_player(func:(p:Player,id:string)=>void){
    players.forEach(func)
}

export function info():string{
    let out = ''
    players.forEach((p,id)=>{
        if(id==my_id){
            out += '(我) '
        }
        out += p.info + '\n'
    })
    return out
}