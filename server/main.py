from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from flask_login import LoginManager, logout_user
from flask_login import login_user, current_user
import comm.user as user
import game.adaptive_sync as ada_sync
from game.room import Room
from utils import color
import json
from engineio.payload import Payload

Payload.max_decode_packets = 100


login_manager = LoginManager()

app = Flask(__name__)
# Set the secret key to some random bytes. Keep this really secret!
app.config['SECRET_KEY'] = 'sseckerdsakf'
socketio = SocketIO(app)

login_manager.init_app(app)

_room_id = ['123','888']
_rooms = dict([(x,Room(socketio,x)) for x in _room_id])


def current_room():
    room_id = current_user.room_id
    return _rooms[room_id]

@login_manager.user_loader
def load_user(user_id):
    return user.get_user(user_id)

@app.route('/')
def hello_world():
    return 'hi'

@socketio.on('connect')
def handle_connection(auth):
    
    
    print('new client join!!!!')
    print(request.environ.get('HTTP_X_REAL_IP'))
    print(auth)
    room_id = auth['room_id']
    


    u = user.new_user(room_id)
    login_user(u)
    join_room(room_id)
    
    room = current_room()
    game = room.game
    gsu = room.gsu
    message_list = room.message_list
    
    p = game.new_player()
    u.player_id = p.id
    emit('msg init',{'msg_list':message_list})
    player_info = p.net()
    player_info['player_id'] = p.id
    print(player_info)
    emit('game init',{'player_info':player_info,'sprite_sheet':game.sprite_sheet})
    gsu.make_sync_ready()
    gsu.emit_game_state(selector=ada_sync.ALL)
    
@socketio.on('disconnect')
def handle_disconnection():
    room = current_room()
    game = room.game
    gsu = room.gsu
    print('disconnect!')
    game.remove_player(current_user.player_id)
    logout_user()
    gsu.make_sync_ready()
    gsu.emit_game_state(selector=ada_sync.ALL, broadcast=True)


@socketio.on('player update')
def handle_player_update(o):
    room = current_room()
    game = room.game
    gsu = room.gsu
    print(color('receive','green'),json.dumps(o))
    game.update_from_player(o)
    gsu.make_sync_ready()


@socketio.on('my event')
def handel_my_event(o):
    room = current_room()
    message_list = room.message_list
    print('received obj: '+str(o))
    who = o['who']
    msg = o['msg']
    message_list.append((who,msg))
    emit('my response',{'who':who,'msg':msg},broadcast=True)

@app.route('/hello',methods=['GET'])
def hello():
    a = request.args.get('who')
    d = {
        'yjw':'杨佳文',
        'zc':'周畅',
        'gzw':'高志文',
        'hxy':'胡曦月',
        'zh':'周航'
        }
    return 'hello '+d.get(a,'你谁?')
        
@socketio.on('get_game_state')
def get_game_state(args):
    room = current_room()
    game = room.game
    return game.net(selector=ada_sync.ALL)
    
@socketio.on('claim_ownership')        
def claim_ownership(args):
    '''
    args:{
        'player_id':str,
        'sprite_id':str,
        'ts':int}
    '''
    room = current_room()
    game = room.game
    ret = game.claim_ownership(args['player_id'], args['sprite_id'], args['ts'])
    print(color('claim ownership','red'),'success:',ret)
    return {'success':ret}
    

@socketio.on('release_ownership')
def release_ownership(args):
    '''
    args:{
        'player_id':str,
        'sprite_id':str,
        'ts':int,
        'sprite_data':object}
    '''
    room = current_room()
    game = room.game
    print(color('release ownership','blue'))
    game.release_ownership(args['player_id'],args['sprite_id'],args['ts'],args['sprite_data'])
    

if __name__=='__main__':
    socketio.run(app,host='0.0.0.0',port=5000,debug=True,use_reloader=False)