from __future__ import annotations
import abc
import threading

ALL = 'all'
RECENT = 'recent'

class SyncTagger:
    def __init__(self) -> None:
        self.current_tag = 0
        self.lock = threading.Lock()
        
    def tick(self):
        self.lock.acquire()
        self.current_tag += 1
        self.lock.release()
    
    def tag(self,x:SyncObject):
        x.tag = self.current_tag
    
    def match(self,x:SyncObject,selector:str):
        if selector==ALL:
            return True
        elif selector==RECENT:
            return x.tag == self.current_tag
        else:
            raise NotImplementedError


class SyncObject:
    def __init__(self,tagger:SyncTagger) -> None:
        self.tag = None
        self.tagger = tagger
        self.tagger.tag(self)

    def update(self,data):
        '''
        Do not override
        '''
        self.tagger.tag(self)
        self._update(data)
    
    @abc.abstractmethod    
    def _update(self,data):
        pass

    @abc.abstractmethod
    def net(self):
        pass




