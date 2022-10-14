import { createApp } from "vue";
import App from "./App.vue";

import { createRouter, createWebHashHistory } from 'vue-router'


const router = createRouter({
    history: createWebHashHistory(),
    routes:[
        {path:'/room/:room_id',component:App}
    ]
})

const app = createApp({})
app.use(router)
app.mount('#app')