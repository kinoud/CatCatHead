from flask import Flask, request
from flask_socketio import SocketIO, send, emit
from flask_login import LoginManager, logout_user
from flask_login import login_user, current_user
import threading
import time
import game.game as game
import comm.user as user
import comm.adaptive_sync as ada_sync
from utils import color

login_manager = LoginManager()

app = Flask(__name__)
# Set the secret key to some random bytes. Keep this really secret!
app.config['SECRET_KEY'] = 'sseckerdsakf'
socketio = SocketIO(app)

login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return user.get_user(user_id)

message_list = [('admin',':)')]

@app.route('/')
def hello_world():
    return 'hi'

@socketio.on('connect')
def handle_connection(auth):
    print('new client join!!!!')
    print(request.environ.get('HTTP_X_REAL_IP'))
    print(auth)
    p = game.new_player()
    u = user.new_user(p.id)
    login_user(u)
    emit('msg init',{'msg_list':message_list})
    player_info = p.net()
    player_info['player_id'] = p.id
    print(player_info)
    emit('game init',{'player_info':player_info})
    make_sync_ready()
    emit_game_state(selector=ada_sync.ALL)
    
@socketio.on('disconnect')
def handle_disconnection():
    print('disconnect!')
    game.remove_player(current_user.player_id)
    logout_user()
    make_sync_ready()

sync_ready = threading.Semaphore(0)
sync_ready_lock = threading.Lock()

def make_sync_ready():
    sync_ready_lock.acquire()
    if sync_ready._value==0:
        sync_ready.release()
    sync_ready_lock.release()

@socketio.on('player update')
def handle_player_update(json):
    print(color('receive','green'),json)
    game.update_from_player(json)
    make_sync_ready()


@socketio.on('my event')
def handel_my_event(json):
    print('received json: '+str(json))
    who = json['who']
    msg = json['msg']
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

def emit_game_state(selector=ada_sync.ALL,broadcast=False):
    net = game.net(selector=selector)
    if broadcast:
        print(color('broadcast','purple'),net)
        socketio.emit('heartbeat',net)
    else:
        print(color('send','purple'),net)
        emit('heartbeat',net)

def sync_recent_updates():
    while True:
        sync_ready.acquire()
        emit_game_state(selector=ada_sync.RECENT,broadcast=True)
        game.sync_tick()
        time.sleep(0.2)

def sync_everything():
    while True:
        emit_game_state(selector='all',broadcast=True)
        game.sync_tick()
        time.sleep(10)

if __name__=='__main__':
    threading.Thread(target=sync_recent_updates,daemon=True).start()
    threading.Thread(target=sync_everything,daemon=True).start()
    
    socketio.run(app,host='0.0.0.0',port=5000,debug=True,use_reloader=False)