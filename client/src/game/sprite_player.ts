import * as sprite from './sprite'
import * as player from './player'
import type { Application } from '@pixi/app'
import { add_to_layer, layer_index, remove_from_layer, update_top_z_index } from './display'


export function update(server_data,pixiapp:Application){
    const sprite_pack = server_data.sprites
    const player_pack = server_data.players
    const selector = server_data.selector
    update_sprites(sprite_pack,selector,pixiapp)
    update_players(player_pack,selector)
    populate_players()
}

function update_sprites(sprite_pack,selector:string,pixiapp:Application){
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

        player.get_player_by_id(s.owner)
        
        s.update(data,true)
        
        update_top_z_index(s)
    }
    
    if(selector=='all'){
        sprite.for_each_sprite((s,id)=>{
            if(!(id in sprite_pack)){
                to_remove.push(s)
            }
        })
    }
    
    to_remove.forEach((s,_)=>{
        sprite.remove_sprite(s)
    })

    to_add.forEach((s,_)=>{
        console.log('add to stage')
        if(s.type=='mouse'){
            add_to_layer(layer_index.HIGH,s)
        }else{
            add_to_layer(layer_index.MID,s)
        }
    })
    to_remove.forEach((s,_)=>{
        remove_from_layer(s)
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

function populate_players(){
    player.for_each_player(
        (p,i)=>{
        p.sprites.clear()
    })
    sprite.for_each_sprite(
        (s,i)=>{
        player.get_player_by_id(s.owner)?.take_sprite(s)
    })
}
