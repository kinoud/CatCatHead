import * as interaction from './interaction/interaction'
import type { Sprite } from './sprite'
import { my_id as me, I } from "./player"
import * as sprite from './sprite'
import {rpc} from './comm'
import { shelter_sprite, unshelter_sprite } from './state_update'


export function setup(){
    interaction.add_listener(interaction.EVENT.SELECTED,e=>{
        const s:Sprite = e.sprite
        shelter_sprite(s)
        sprite.update_sprite(s,{owner:me})
        rpc('claim_ownership',{'player_id':me,'sprite_id':s.id},
        (res)=>{
            if(!res['success']){
                unshelter_sprite(s)
                interaction.unselect_sprite(s)
            }
        })
    })

    interaction.add_listener(interaction.EVENT.SELECTED_OUT,e=>{
        const s:Sprite = e.sprite
        sprite.update_sprite(s,{owner:'none'})
        rpc('release_ownership',<ReleaseOwnershipArgs>{
            player_id:me,sprite_id:s.id,
            sprite_data:s.meta
        },()=>{
            unshelter_sprite(s)
        },()=>{
            interaction.select_sprite(s)
        })
    })
}

interface ReleaseOwnershipArgs{
    player_id:string
    sprite_id:string
    ts:number
    sprite_data:object
}