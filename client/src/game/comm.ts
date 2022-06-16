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
    })
}

let emit_ready:boolean = true
let emit_try:boolean = false
let reset_timer:number

function _emit_player_update(){
  console.log('emit')
  const player_update = game.get_player_update()
  if(!player_update)return
  socket.emit('player update',player_update)
}

export function emit_player_update(emergent=false){
  if(emergent){
    clearTimeout(reset_timer)
    _emit_player_update()
  }else{
    if(!emit_ready){
      emit_try = true
      return
    }
  }
  emit_ready = false
  reset_timer = setTimeout(()=>{
    emit_ready = true
    if(emit_try){
      emit_try = false
      _emit_player_update()
    }
  },200)
}

export function rpc(func:string,args:object,callback:(res:object)=>void=null){
  if(!callback){
    socket.emit(func,args)
  }else{
    socket.emit(func,args,callback)
  }
}
