import { createRouter, createWebHashHistory } from 'vue-router';
import Settings from './../routes/Settings.vue'
import Home from '../routes/Home.vue';
import QuickPrompts from '../routes/QuickPrompts.vue';
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/settings', component: Settings },
    { path: '/quick-prompts', component: QuickPrompts },
  ]
})
