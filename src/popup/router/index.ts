import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../routes/Home.vue'
import QuickPrompts from '../routes/QuickPrompts.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/quick-prompts', component: QuickPrompts },
  ],
})
