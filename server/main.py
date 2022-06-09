from flask import Flask, request
from flask_socketio import SocketIO, send, emit
from flask_login import LoginManager, logout_user
from flask_login import login_user, current_user
import threading
import time
import game.game as game
import commu.user as user
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
    
@socketio.on('disconnect')
def handle_disconnection():
    print('disconnect!')
    game.remove_player(current_user.player_id)
    logout_user()
    
@socketio.on('player update')
def handle_player_update(json):
    print(color('receive','green'),json)
    game.update_from_player(json)
    if json['emergent']:
        broadcase_game_state()


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

def broadcase_game_state():
    json = game.net()
    print(color('send','purple'),json)
    socketio.emit('heartbeat',json)


def game_heartbeat():
    while True:
        broadcase_game_state()
        time.sleep(0.5)

if __name__=='__main__':
    # print('??')
    t = threading.Thread(target=game_heartbeat,daemon=True)
    t.start()
    
    socketio.run(app,host='0.0.0.0',port=5000,debug=True,use_reloader=False)