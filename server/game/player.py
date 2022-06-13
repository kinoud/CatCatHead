from game.sprite import Sprite
from comm.adaptive_sync import SyncObject, SyncTagger

class Player(SyncObject):
    def __init__(self,id,mouse_sprite:Sprite,sync_tagger:SyncTagger) -> None:
        super().__init__(sync_tagger)
        self.id = id
        self.sprites:dict[str,Sprite] = dict()
        self.mouse = mouse_sprite
        self.take_sprite(mouse_sprite)
        
    def _update(self,data):
        pass
    
    def take_sprite(self, sprite:Sprite):
        sprite.owner = self.id
        self.sprites[sprite.id]=sprite
    
    def spare_sprite(self, sprite:Sprite):
        if sprite.owner == self.id:
            sprite.owner = 'none'
        self.sprites.pop(sprite.id)
        
    def spare_all_sprites(self):
        for sprite in self.sprites.values():
            if sprite.owner == self.id:
                sprite.owner = 'none'
        self.sprites.clear()
    
    def net(self):
        return {
            'mouse_sprite_id':self.mouse.id}
        
class PlayerManager:
    def __init__(self,sync_tagger:SyncTagger) -> None:
        self.next_id = 0
        self.players:dict[str,Player] = dict()
        self.sync_tagger = sync_tagger

    def new_player(self, mouse_sprite:Sprite):
        player_id = 'p'+str(self.next_id)
        self.next_id += 1
        p = Player(player_id, mouse_sprite, sync_tagger=self.sync_tagger)
        self.players[player_id] = p
        return p
    
    def get_player_by_id(self, player_id):
        return self.players.get(player_id)

    def remove_player(self, player_id):
        p:Player = self.players[player_id]
        p.mouse.destroy()
        p.spare_all_sprites()
        self.players.pop(player_id)
    
    def net(self,selector='all'):
        o = dict()
        for k,v in self.players.items():
            if self.sync_tagger.match(v,selector=selector):
                o[k] = v.net()
        return o