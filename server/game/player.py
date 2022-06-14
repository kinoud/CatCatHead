from game.sprite import Sprite
from game.adaptive_sync import SyncObject, SyncTagger

class Player(SyncObject):
    def __init__(self,id,mouse_sprite:Sprite,sync_tagger:SyncTagger) -> None:
        super().__init__(sync_tagger)
        self.id = id
        self.mouse = mouse_sprite
        self.mouse.owner = id
        self.ts = 0
        
    def compare_and_set_ts(self,ts:int):
        '''
        returns True if ts>=self.ts and set ts, otherwise returns False
        '''
        self.acquire()        
        if self.ts<=ts:
            self.ts = ts
            ret = True
        else:
            ret = False
        self.release()
        return ret
    
    def _update(self,data):
        pass
    
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
        self.players.pop(player_id)
    
    def net(self,selector='all'):
        o = dict()
        for k,v in self.players.items():
            if self.sync_tagger.match(v,selector=selector):
                o[k] = v.net()
        return o