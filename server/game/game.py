
from random import random
from game.sprite import Sprite, SpriteManager
from game.player import PlayerManager
from game.man_sprite_player import ManagerOfSpritesAndPlayers
from game.adaptive_sync import SyncTagger
import game.adaptive_sync as ada_sync

import json

sync_tagger = SyncTagger()
sprite_manager = SpriteManager(sync_tagger=sync_tagger)
player_manager = PlayerManager(sync_tagger=sync_tagger)
manager_sprite_player = ManagerOfSpritesAndPlayers(sprite_manager,player_manager)


sprite_sheet = 'blokus.json'
with open('../client/public/blokus.json','r') as f:
    def rand_pos_in_rect(x,y,w,h):
        return (x+random()*w,y+random()*h)
    
    def ini_pos(name):
        if 'board' in name:
            return (300,300)
        if 'blue' in name:
            return rand_pos_in_rect(100,0,200,100)
        if 'red' in name:
            return rand_pos_in_rect(0,100,100,200)
        if 'green' in name:
            return rand_pos_in_rect(100,300,200,100)
        if 'yellow' in name:
            return rand_pos_in_rect(300,100,100,200)
        raise NotImplementedError
    
    def get_type(name):
        if 'board' in name:
            return Sprite.BACKGROUND
        return None
    
    o = json.loads(f.read())
    for name in o['frames'].keys():
        xy = ini_pos(name)
        sprite_manager.new_sprite(name,owner='none',x=xy[0],y=xy[1],type=get_type(name))

# for i in range(10):
#     x = int(random()*256)
#     y = int(random()*256)
#     # x,y=0,0
#     sprite_manager.new_sprite('cat.png',owner='none',x=x,y=y)

def new_player():
    mouse = sprite_manager.new_sprite('mouse.png',anchor_x=0,anchor_y=0,type='mouse')
    p = player_manager.new_player(mouse)
    return p

def remove_player(player_id):
    manager_sprite_player.remove_player(player_id)
    
def update_from_player(data):
    who = data['player_id']
    ts = data['player']['ts']
    manager_sprite_player.update_sprites(data['sprites'],who,ts)
    
def claim_ownership(player_id:str,sprite_id:str,ts:int):
    return manager_sprite_player.claim_ownership(player_id,sprite_id,ts)

def release_ownership(player_id:str,sprite_id:str,ts:int,sprite_data:object):
    manager_sprite_player.release_ownership(player_id,sprite_id,ts,sprite_data)
    
def net(selector=ada_sync.ALL):
    return {
        'selector':selector,
        'sprites':sprite_manager.net(selector=selector),
        'players':player_manager.net(selector=selector),
        }

def sync_tick():
    sync_tagger.tick()