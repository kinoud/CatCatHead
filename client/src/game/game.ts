import * as PIXI from 'pixi.js'
import { pointer, setup as interaction_setup } from './interaction'
import { setup as comm_setup } from './comm'
import * as sprite from './sprite'
import * as player from './player'
import { update as update_sprite_player } from './sprite_player'


export var loaded = false

export const pixiapp = new PIXI.Application({width:256,height:256})

export function setup(socket, div:HTMLDivElement){
    
    div.appendChild(pixiapp.view)

    interaction_setup(pixiapp.view)

    comm_setup(socket)

    PIXI.Loader.shared
    .add(
        ['cat.png','mouse.png'])
    .load(()=>{
        console.log('loaded!')
        gameLoop()
        loaded = true
    })
}

function gameLoop(){
    requestAnimationFrame(gameLoop)

    const I:player.Player = player.I()
    if(I){
        const mouse = I.mouse
        if(mouse){
            mouse.x = pointer.x
            mouse.y = pointer.y
            mouse.pixi.x += (pointer.x-mouse.pixi.x)*0.5
            mouse.pixi.y += (pointer.y-mouse.pixi.y)*0.5
        }
    }
    
    sprite.game_loop()
}

export function add_player(info){
    console.log(info)
    console.log(player.new_player(info.player_id,info.mouse_sprite_id))
}

export function set_player(id:string){
    player.set_player(id)
}

export function get_player_update(){ 
    const sprites = {}
    player.I().sprites.forEach((s,_)=>{
        sprites[s.id] = s.meta
    })
    
    return {
        'player_id': player.I().id,
        'player': player.I().meta,
        'sprites': sprites
    }
}

export function update(server_data){
    // console.log('receive update',server_data)
    update_sprite_player(server_data,pixiapp)
}

export function info():string{
    return '当前在线:\n' + player.info()
}
