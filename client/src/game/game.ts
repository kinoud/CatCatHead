import * as PIXI from 'pixi.js'
import { Application } from "@pixi/app"
import { setup as interaction_setup, frame_loop as interaction_loop } from './interaction/interaction'
import { rpc, setup as comm_setup } from './comm'
import * as player from './player'
import { frame_loop as display_loop, setup as display_setup } from './display'
import { update as update_sprite_player, setup as sprite_player_setup} from './state_update'
import {setup as control_setup} from './control'
import { set_sprite_sheet } from './sprite'
import { ref } from 'vue'
const resources = PIXI.Loader.shared.resources

export var resources_loaded = false

export const pixiapp = new Application({width:1000,height:700})


export function setup(socket, div:HTMLDivElement){
    div.appendChild(pixiapp.view)
    interaction_setup(pixiapp)
    control_setup()
    comm_setup(socket)
    display_setup(pixiapp)
    sprite_player_setup()
    game_loop()
}

export function load_resource(sprite_sheet:string){
    resources_loaded = false
    set_sprite_sheet(sprite_sheet)
    
    let all_resources = ['cat.png','mouse.png',sprite_sheet]

    all_resources = all_resources.filter(x=>{if(resources[x]){return false}else{return true}})

    if(all_resources.length>0){
        PIXI.Loader.shared
        .add(all_resources)
        .load(()=>{
            console.log('resource loaded!')
            rpc('get_game_state',{},(res)=>{update(res)})
            resources_loaded = true
        })
    }else{
        resources_loaded = true
    }
    
}

function game_loop(){
    requestAnimationFrame(game_loop)
    if(resources_loaded){
        interaction_loop()
        display_loop()
    }
}

export function set_player(player_info){
    console.log(player_info)
    const p =player.get_player_by_id(player_info.player_id)
    if(!p){
        player.new_player(player_info.player_id,player_info.mouse_sprite_id)
    }
    player.set_player(player_info.player_id)
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

export const log_msg = ref('')

export function print_log(msg:string){
    console.log(log_msg.value,msg)
    log_msg.value += msg + '\n'
    
}

export function info():string{
    return '当前在线:\n' + player.info()
}
