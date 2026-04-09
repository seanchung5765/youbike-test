

import { createApp } from 'vue'
import { createPinia } from 'pinia' // <--- 檢查這行有沒有漏掉！
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia()) // 這裡使用了 createPinia
app.use(router)

app.mount('#app')