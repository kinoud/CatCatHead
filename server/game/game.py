
from random import random

from flask_login import current_user
from game.sprite import Sprite, SpriteManager
from game.player import PlayerManager
from game.man_sprite_player import ManagerOfSpritesAndPlayers
from game.adaptive_sync import SyncTagger
import game.adaptive_sync as ada_sync
from utils import color
from flask_socketio import SocketIO, emit
import json
import threading
import time

class Game:
    def __init__(self) -> None:
        self.sync_tagger = SyncTagger()
        self.sprite_manager = SpriteManager(sync_tagger=self.sync_tagger)
        self.player_manager = PlayerManager(sync_tagger=self.sync_tagger)
        self.manager_sprite_player = ManagerOfSpritesAndPlayers(self.sprite_manager,self.player_manager)
        self.sprite_sheet = 'blokus.json'
        
        with open('../client/public/blokus.json','r') as f:
            def rand_pos_in_rect(x,y,w,h):
                return (x+random()*w,y+random()*h)
            
            x0 = 100
            y0 = -100
            w = 500
            h = 150
            s = 500
            
            def ini_pos(name):
                if 'board' in name:
                    return (s/2+h+x0,s/2+h+y0)
                if 'green' in name:
                    return rand_pos_in_rect(h+x0,0+y0,w,h)
                if 'blue' in name:
                    return rand_pos_in_rect(0+x0,h+y0,h,w)
                if 'yellow' in name:
                    return rand_pos_in_rect(h+x0,h+s+y0,w,h)
                if 'red' in name:
                    return rand_pos_in_rect(h+s+x0,h+y0,h,w)
                raise NotImplementedError
            
            def get_type(name):
                if 'board' in name:
                    return Sprite.BACKGROUND
                return None
            
            o = json.loads(f.read())
            for name in o['frames'].keys():
                xy = ini_pos(name)
                self.sprite_manager.new_sprite(name,owner='none',x=xy[0],y=xy[1],type=get_type(name))


    def new_player(self):
        mouse = self.sprite_manager.new_sprite('mouse.png',anchor_x=0,anchor_y=0,type='mouse')
        p = self.player_manager.new_player(mouse)
        return p

    def remove_player(self,player_id):
        self.manager_sprite_player.remove_player(player_id)
        
    def update_from_player(self,data):
        who = data['player_id']
        ts = data['player']['ts']
        self.manager_sprite_player.update_sprites(data['sprites'],who,ts)
        
    def claim_ownership(self,player_id:str,sprite_id:str):
        return self.manager_sprite_player.claim_ownership(player_id,sprite_id)

    def release_ownership(self,player_id:str,sprite_id:str,sprite_data:object):
        self.manager_sprite_player.release_ownership(player_id,sprite_id,sprite_data)
        
    def net(self,selector=ada_sync.ALL):
        return {
            'selector':selector,
            'sprites':self.sprite_manager.net(selector=selector),
            'players':self.player_manager.net(selector=selector),
            }
        
class GameSyncUnit:
    def __init__(self,game:Game,socketio:SocketIO,room_id) -> None:
        self.room_id = room_id
        self.game = game
        self.socketio = socketio
        self.sync_ready = threading.Semaphore(0)
        self.sync_ready_lock = threading.Lock()
        threading.Thread(target=self.sync_recent_updates,daemon=True).start()
        threading.Thread(target=self.sync_everything,daemon=True).start()
        
    def make_sync_ready(self):
        '''
        When you updates sth and you want these updates to be considered "RECENT" level so that
        they will be broadcast quickly, you call this function follow your updates.
        '''
        self.sync_ready_lock.acquire()
        if self.sync_ready._value==0:
            self.sync_ready.release()
        self.sync_ready_lock.release()
        
    def emit_game_state(self, selector=ada_sync.ALL,broadcast=False):
        net = self.game.net(selector=selector)
        if broadcast:
            print(color(f'broadcast (room {self.room_id})','purple'),net)
            self.socketio.emit('heartbeat',net,to=self.room_id)
        else:
            print(color(f'send (room {self.room_id})','purple'),net)
            emit('heartbeat',net)
    
    def sync_recent_updates(self):
        while True:
            print(self,'acquire')
            self.sync_ready.acquire()
            
            self.game.sync_tagger.mu.acquire() # about this lock, see issues/001
            self.emit_game_state(selector=ada_sync.RECENT,broadcast=True)
            
            self.game.sync_tagger.tick()
            self.game.sync_tagger.mu.release()
            
            time.sleep(0.2)

    def sync_everything(self):
        while True:
            self.game.sync_tagger.mu.acquire() # about this lock, see issues/001
            self.emit_game_state(selector='all',broadcast=True)
            self.game.sync_tagger.tick()
            self.game.sync_tagger.mu.release()
            time.sleep(60)