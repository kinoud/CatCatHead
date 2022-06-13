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
            p:Player = self.man_players.get_player_by_id(s.owner)
            if p:
                p.spare_sprite(s)
            if s.compare_and_set_1_update_record(who,ts):
                s.update(sprite_data)
            p:Player = self.man_players.get_player_by_id(s.owner)
            if p:
                p.take_sprite(s)