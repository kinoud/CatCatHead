
from game.adaptive_sync import SyncTagger,SyncObject



class Sprite(SyncObject):
    BACKGROUND = 'background'
    MOUSE = 'mouse'
    def __init__(self,id:str,img:str,owner:str='none',
                 x=0,y=0,anchor_x=0.5,anchor_y=0.5,
                 type=None,sync_tagger:SyncTagger=None,
                 z_index=0,
                 rotation=0,
                 scale_x=1,
                 scale_y=1) -> None:
        super().__init__(sync_tagger)
        self.id = id
        self.owner = owner
        self.img = img
        self.x = x
        self.y = y
        self.z_index = z_index
        self.anchor_x = anchor_x
        self.anchor_y = anchor_y
        self.type = type
        self.rotation =rotation
        self.scale_x = scale_x
        self.scale_y = scale_y
        
    def _update(self,data:dict):
        for attr in data.keys():
            self.__dict__[attr] = data[attr]          
        
    def destroy(self):
        self.owner = '_destroyed'
        
    def net(self):
        o = {
            'img':self.img,
            'owner': self.owner,
            'anchor_x': self.anchor_x,
            'anchor_y': self.anchor_y,
            'x':self.x,
            'y':self.y,
            'z_index':self.z_index,
            'rotation':self.rotation,
            'scale_x':self.scale_x,
            'scale_y':self.scale_y}
        if self.type:
            o['type'] = self.type
        return o
        
class SpriteManager:
    def __init__(self,sync_tagger:SyncTagger) -> None:
        self.sprites:dict[str,Sprite] = dict()
        self.next_id = 0
        self.sync_tagger = sync_tagger
        
    def get_sprite_by_id(self,id):
        return self.sprites.get(id)
        
    def new_sprite(self,img:str,owner:str='none',x=0,y=0,anchor_x=0.5,anchor_y=0.5,type=None,z_index=0):
        sprite_id = 's'+str(self.next_id)
        self.next_id += 1
        s = Sprite(sprite_id,img,owner,x,y,anchor_x,anchor_y,type=type,sync_tagger=self.sync_tagger,z_index=z_index)
        self.sprites[sprite_id] = s
        return s
    
    def remove_sprite(self,id):
        self.sprites.pop(id)
    
    def gc(self):
        to_delete = []
        for k,v in self.sprites.items():
            if v.owner=='_destroyed':
                to_delete.append(k)
        
        for k in to_delete:
            self.sprites.pop(k)
    
    def net(self,selector='all'):
        self.gc()
        o = dict()
        for k,v in self.sprites.items():
            if self.sync_tagger.match(v, selector=selector):
                o[k] = v.net()
        return o
    