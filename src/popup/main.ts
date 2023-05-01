import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { createPinia } from 'pinia'
import { VTooltip } from 'floating-vue'
import 'floating-vue/dist/style.css'
import './main.css'

const pinia = createPinia()

const app = createApp(App)
app.use(router)
app.use(pinia)
app.directive('tooltip', VTooltip)

app.mount('#app')
