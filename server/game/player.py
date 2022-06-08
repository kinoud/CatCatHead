from game.sprite import Sprite

class Player:
    def __init__(self,id,mouse_sprite:Sprite) -> None:
        self.id = id
        self.sprites:dict[str,Sprite] = dict()
        self.mouse = mouse_sprite
        
        self.take_sprite(mouse_sprite)
        
        
        
    def update(self,data):
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
    def __init__(self) -> None:
        self.next_id = 0
        self.players = dict()

    def new_player(self, mouse_sprite:Sprite):
        player_id = 'p'+str(self.next_id)
        self.next_id += 1
        p = Player(player_id, mouse_sprite)
        self.players[player_id] = p
        return p
    
    def get_player_by_id(self, player_id):
        return self.players.get(player_id)

    def remove_player(self, player_id):
        p:Player = self.players[player_id]
        p.mouse.destroy()
        p.spare_all_sprites()
        self.players.pop(player_id)
    
    def net(self):
        o = dict()
        for k,v in self.players.items():
            o[k] = v.net()
        return o