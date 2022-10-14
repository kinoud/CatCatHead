from __future__ import annotations
import abc
import threading


ALL = 'all'
RECENT = 'recent'

class SyncTagger:
    def __init__(self) -> None:
        self.current_tag = 0
        
    def tick(self):
        self.current_tag += 1
    
    def tag(self,x:SyncObject):
        x._tag = self.current_tag
    
    def match(self,x:SyncObject,selector:str):
        if selector==ALL:
            return True
        elif selector==RECENT:
            return x._tag == self.current_tag
        else:
            raise NotImplementedError


class SyncObject:
    def __init__(self,tagger:SyncTagger) -> None:
        self._tag = None
        self._tagger = tagger
        self._tagger.tag(self)
        self._lock = threading.Lock()

    def acquire(self):
        self._lock.acquire()
    
    def release(self):
        self._lock.release()
    
    def update(self,data):
        '''
        Do not override
        '''
        self._tagger.tag(self)
        self._update(data)
    
    @abc.abstractmethod    
    def _update(self,data):
        pass

    @abc.abstractmethod
    def net(self):
        pass




