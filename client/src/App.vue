<script setup lang="ts">

import {ref, onMounted} from 'vue'
import { getCurrentInstance } from 'vue';
import * as game from './game/game';
import * as interaction from './game/interaction'
import { my_id } from './game/player';

const app = getCurrentInstance().proxy
const socket = app['socket']

const text_msg = ref('')
const messages = ref('')
const game_info = ref('')
const warning = ref('')
const name = ref(my_id)
const selected = ref(false)


function on_input_msg(e){
  text_msg.value = e.target.value
}

function send_text(){
  if(text_msg.value.trim()==''){
    warning.value = '发送消息不能为空'
    return
  }else{
    warning.value = ''
    
  }
  socket.emit('my event',{who:my_id,msg:text_msg.value})
  text_msg.value = ''
}

function click_left_rotate(){
  interaction.rotate_selected(-Math.PI/2)
}
function click_right_rotate(){
  interaction.rotate_selected(Math.PI/2)
}
function click_flip(){
  interaction.flip_selected()
}

const game_div = ref(null)

const msg_box = ref(null)

onMounted(()=>{
  game.setup(socket,game_div.value)

  setInterval(()=>{
    game_info.value = game.info()
    name.value = my_id
  },1000)

  interaction.add_listener(interaction.EVENT.SELECTED,(e)=>{selected.value=true})
  interaction.add_listener(interaction.EVENT.SELECTED_OUT,(e)=>{selected.value=false})

  
  socket.on('msg init',(res)=>{
    let his = res.msg_list
    for(let i=0;i<his.length;i++){
      messages.value += his[i][0] + ': ' + his[i][1] + '\n'
    }
    msg_box.value.scrollTop = msg_box.value.scrollHeight
  })

  socket.on('my response',(res)=>{
    console.log(res)
    messages.value = messages.value+res.who+': '+res.msg+'\n'
    msg_box.value.scrollTop = msg_box.value.scrollHeight
  })

})

</script>

<template>
    <div class="con">
      <textarea class="float-left" rows="20" cols="20" readonly>{{game_info}}</textarea>
      <div ref="game_div" class="float-left"></div>

      <div class="float-left">
        <button @click="click_left_rotate" :disabled="!selected">↓o</button>
        <button @click="click_right_rotate" :disabled="!selected">o↓</button>
        <button @click="click_flip" :disabled="!selected">翻转</button>
        <div>
          <textarea ref="msg_box" rows="10" cols="30" readonly>{{messages}}</textarea>
        </div>
        {{name}}:
        <input :value="text_msg" placeholder="输入聊天消息" v-on:input="on_input_msg" @keydown.enter="send_text">
        <button v-on:click="send_text">发送</button>
        <p>{{warning}}</p>
      </div>

    </div>
  
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.float-left{
  float: left;
}

.con{
  overflow: hidden;
  left: 50%
}


</style>
