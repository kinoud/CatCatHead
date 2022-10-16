import * as sprite from './sprite'
import * as player from './player'

export function setup(){
    sprite.add_listener(sprite.EVENT.NEW_SPRITE,e=>{
        player.get_player_by_id(e.sprite.owner)?.take_sprite(e.sprite)
    })
    sprite.add_listener(sprite.EVENT.UPDATE_SPRITE,e=>{
        if(!e.data.owner||!e.accept||e.original_data.owner==e.data.owner)return
        const s:sprite.Sprite = e.sprite
        player.get_player_by_id(e.original_data.owner)?.spare_sprite(s)
        player.get_player_by_id(e.data.owner)?.take_sprite(s)
    })
}

const sheltered_sprites:Set<sprite.Sprite> = new Set()

/**
 * shelter a sprite.
 * sheltered sprite won't response to any updates from server.
 * @param s 
 */
export function shelter_sprite(s:sprite.Sprite){
    sheltered_sprites.add(s);
}

/**
 * unshelter a sprite.
 * sheltered sprite won't response to any updates from server.
 * @param s 
 */
export function unshelter_sprite(s:sprite.Sprite){
    sheltered_sprites.delete(s);
}


export function update(server_data){
    const sprite_pack = server_data.sprites
    const player_pack = server_data.players
    const selector = server_data.selector
    update_sprites(sprite_pack,selector)
    update_players(player_pack,selector)
}

function update_sprites(sprite_pack,selector:string){
    const to_add:Array<sprite.Sprite> = []
    const to_remove:Array<sprite.Sprite> = []
    for(let id in sprite_pack){
        const data = sprite_pack[id]

        const s = sprite.get_sprite_by_id(id)
        if(!s){
            to_add.push(sprite.new_sprite(id,data))
            continue
        }

        if(s.owner==player.my_id||data.owner==player.my_id){
        // if(s.owner==player.my_id){
            continue
        }
        if(!sheltered_sprites.has(s))
            sprite.update_sprite(s,data)
    }
    
    if(selector=='all'){
        sprite.for_each_sprite((s)=>{
            if(!(s.id in sprite_pack)){
                to_remove.push(s)
            }
        })
    }
    
    to_remove.forEach((s)=>{
        sprite.remove_sprite(s)
    })
}

function update_players(player_pack,selector:string){
    for(let id in player_pack){
        const data = player_pack[id]
        const p = player.get_player_by_id(id)
        if(!p){
            player.new_player(id, data.mouse_sprite_id)
        }else{
            p.update(data)
        }
    }

    const to_delete = []

    if(selector=='all'){
        player.for_each_player((p,i)=>{
            if(!(i in player_pack)){
                to_delete.push(i)
            }
        })
    }
    
    to_delete.forEach((id,_)=>{
        player.remove_player(id)
    })
    
}
