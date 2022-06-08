import * as sprite from './sprite'
import * as player from './player'
import type { Application } from 'pixi.js'


export function update(server_data,pixiapp:Application){
    const sprite_pack = server_data.sprites
    const player_pack = server_data.players
    update_sprites(sprite_pack,pixiapp)
    update_players(player_pack)
    populate_players()
}

function update_sprites(sprite_pack,pixiapp:Application){
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
    }
    
    sprite.for_each_sprite((s,id)=>{
        if(!(id in sprite_pack)){
            to_remove.push(s)
        }
    })

    to_remove.forEach((s,_)=>{
        sprite.remove_sprite(s.id)
    })

    to_add.forEach((s,_)=>{
        console.log('add to stage')
        pixiapp.stage.addChild(s.pixi)
    })
    to_remove.forEach((s,_)=>{
        pixiapp.stage.removeChild(s.pixi)
    })
}

function update_players(player_pack){
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

    player.for_each_player((p,i)=>{
        if(!(i in player_pack)){
            to_delete.push(i)
        }
    })

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
