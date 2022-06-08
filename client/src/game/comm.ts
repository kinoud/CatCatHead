import * as game from './game'


var socket

export function setup(game_socket){
  socket = game_socket
  socket.on('game init',(res)=>{
      game.add_player(res.player_info)
      game.set_player(res.player_info.player_id)
    })

  socket.on('heartbeat',(res)=>{
      // console.log(res)
      if(!game.loaded){
        return
      }
      game.update(res)
      setTimeout(emit_player_update, 100);
    })
}

export function emit_player_update(emergent=false){
  const player_update = game.get_player_update()
  if(!player_update)return
  player_update['emergent']=emergent
  // console.log('send',player_update)
  socket.emit('player update',player_update)
}