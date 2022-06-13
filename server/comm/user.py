
_id = 0
_users = dict()

class User:
    def __init__(self,id:str,player_id) -> None:
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = True
        self.id = id
        self.player_id = player_id
    
    def get_id(self):
        return self.id        
    

def get_user(user_id:str):
        return _users[user_id]

def new_user(player_id):
    global _id
    id = str(_id)
    _id = _id + 1
    _users[id] = User(id,player_id)
    return _users[id]