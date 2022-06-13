
from comm.adaptive_sync import SyncTagger,SyncObject


class Sprite(SyncObject):
    def __init__(self,id:str,img:str,owner:str='none',x=0,y=0,anchor_x=0.5,anchor_y=0.5,type=None,sync_tagger:SyncTagger=None) -> None:
        super().__init__(sync_tagger)
        self.id = id
        self.owner = owner
        self.img = img
        self.x = x
        self.y = y
        self.anchor_x = anchor_x
        self.anchor_y = anchor_y
        self.type = type
        self.update_records = dict()
        
    def _update(self,data:dict):
        for attr in ['x','y','anchor_x','anchor_y','img','owner']:
            if attr in data.keys():
                self.__dict__[attr] = data[attr]
                
    def compare_and_set_1_update_record(self,who:str,ts:int):
        # print(f'{self.id} {self.update_records} cas {who} {ts}')
        if who not in self.update_records.keys():
            self.update_records[who] = ts
            return True
        if self.update_records[who]<=ts:
            self.update_records[who]=ts
            return True
        return False
        
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
            'update_records':self.update_records}
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
        
    def new_sprite(self,img:str,owner:str='none',x=0,y=0,anchor_x=0.5,anchor_y=0.5,type=None):
        sprite_id = 's'+str(self.next_id)
        self.next_id += 1
        s = Sprite(sprite_id,img,owner,x,y,anchor_x,anchor_y,type=type,sync_tagger=self.sync_tagger)
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
    