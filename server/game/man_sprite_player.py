from game.sprite import Sprite, SpriteManager
from game.player import Player, PlayerManager

class ManagerOfSpritesAndPlayers:
    def __init__(self,man_sprites:SpriteManager,man_players:PlayerManager) -> None:
        self.man_sprites = man_sprites
        self.man_players = man_players
    
    def update_sprites(self,data,who,ts):
        for sprite_id, sprite_data in data.items():
            s:Sprite = self.man_sprites.get_sprite_by_id(sprite_id)
            if not s:
                continue
            
            if s.owner != who:
                continue
            
            if self.man_players.get_player_by_id(who).compare_and_set_ts(ts):
                s.set_update_record(who,ts)
                s.update(sprite_data)
                
    def claim_ownership(self,player_id:str,sprite_id:str,ts:int):
        sprite = self.man_sprites.get_sprite_by_id(sprite_id)
        player = self.man_players.get_player_by_id(player_id)
        auth = player.compare_and_set_ts(ts)
        if not auth:
            print('reject because player auth False')
            return False
        
        sprite.acquire()
        if sprite.owner not in ['none',player_id]:
            print('reject because owner not match')
            ret =  False
        else:
            sprite.update({'owner':player_id})
            ret = True
        sprite.release()
        
        return ret
    
    def release_ownership(self,player_id:str,sprite_id:str,ts:int,sprite_data:object):
        sprite = self.man_sprites.get_sprite_by_id(sprite_id)
        player = self.man_players.get_player_by_id(player_id)
        player.compare_and_set_ts(ts)
        
        sprite.acquire()
        old_ts = sprite.update_records.get(player_id)
        if old_ts is None or old_ts<=ts:
            sprite.update_records[player_id] = ts        
            if sprite.owner == player_id:
                sprite_data['owner'] = 'none'
                sprite.update(sprite_data)
        sprite.release()