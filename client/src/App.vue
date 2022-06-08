<script setup lang="ts">

import {ref, onMounted} from 'vue'
import { getCurrentInstance } from 'vue';
import * as game from './game/game';
import { my_id } from './game/player';

const app = getCurrentInstance().proxy
const socket = app['socket']

const text_msg = ref('')
const messages = ref('')
const game_info = ref('')
const warning = ref('')
const name = ref(my_id)


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

const game_div = ref(null)

const msg_box = ref(null)

onMounted(()=>{
  game.setup(socket,game_div.value)

  setInterval(()=>{
    game_info.value = game.info()
    name.value = my_id
  },1000)
  
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
  <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
  <!-- <HelloWorld msg="Hello Vue 3 + Vite" /> -->
  <div>
    <textarea rows="10" cols="30" readonly>{{game_info}}</textarea>
  </div>
  <div ref="game_div"></div>
  <div>
    <textarea ref="msg_box" rows="10" cols="30" readonly>{{messages}}</textarea>
  </div>
  {{name}}:
  <input :value="text_msg" placeholder="输入聊天消息" v-on:input="on_input_msg">
  <button v-on:click="send_text">发送</button>
  <p>{{warning}}</p>
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
</style>
