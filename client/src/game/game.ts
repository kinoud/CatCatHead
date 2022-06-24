import * as PIXI from 'pixi.js'
import { Application } from "@pixi/app"
import { setup as interaction_setup, frame_loop as interaction_loop } from './interaction'
import { rpc, setup as comm_setup } from './comm'
import * as player from './player'
import { frame_loop as display_loop, setup as display_setup } from './display'
import { update as update_sprite_player, setup as sprite_player_setup} from './sprite_player'
import { set_sprite_sheet } from './sprite'


export var loaded = false

export const pixiapp = new Application({width:700,height:700})


export function setup(socket, div:HTMLDivElement){
    div.appendChild(pixiapp.view)
    interaction_setup(pixiapp)
    comm_setup(socket)
    display_setup(pixiapp)
    sprite_player_setup()
}

export function load_resource(sprite_sheet:string){
    set_sprite_sheet(sprite_sheet)

    PIXI.Loader.shared
    .add(
        ['cat.png','mouse.png',sprite_sheet])
    .load(()=>{
        console.log('resource loaded!')
        rpc('get_game_state',{},(res)=>{update(res)})
        loaded = true
        game_loop()
    })
}

function game_loop(){
    requestAnimationFrame(game_loop)
    interaction_loop()
    display_loop()
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
    update_sprite_player(server_data)
}

export function info():string{
    return '当前在线:\n' + player.info()
}
