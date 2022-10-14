
_id = 0
_users = dict()

class User:
    def __init__(self,id:str,room_id) -> None:
        self.room_id = room_id
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = True
        self.id = id
        self.player_id = None
    
    def get_id(self):
        return self.id        
    

def get_user(user_id:str):
        return _users[user_id]

def new_user(room_id)->User:
    global _id
    id = str(_id)
    _id = _id + 1
    _users[id] = User(id,room_id)
    return _users[id]