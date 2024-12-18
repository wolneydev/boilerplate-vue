import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store' // Importamos a store Vuex
import './assets/main.css'

const app = createApp(App)
app.use(router)
app.use(store) // Usando Vuex
app.mount('#app')
