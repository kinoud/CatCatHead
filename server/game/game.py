
from random import random
from game.sprite import SpriteManager
from game.player import PlayerManager
from game.man_sprite_player import ManagerOfSpritesAndPlayers


sprite_manager = SpriteManager()
player_manager = PlayerManager()
manager_sprite_player = ManagerOfSpritesAndPlayers(sprite_manager,player_manager)


for i in range(6):
    x = int(random()*256)
    y = int(random()*256)
    # x,y=0,0
    sprite_manager.new_sprite('cat.png',owner='none',x=x,y=y)

def new_player():
    mouse = sprite_manager.new_sprite('mouse.png',anchor_x=0,anchor_y=0,type='mouse')
    p = player_manager.new_player(mouse)
    return p

def remove_player(player_id):
    player_manager.remove_player(player_id)
    
def update_from_player(data):
    who = data['player_id']
    ts = data['player']['ts']
    manager_sprite_player.update_sprites(data['sprites'],who,ts)
    
def net():
    return {
        'sprites':sprite_manager.net(),
        'players':player_manager.net()}