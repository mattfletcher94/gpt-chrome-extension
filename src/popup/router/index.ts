import { createRouter, createWebHashHistory } from 'vue-router';
import Main from './../routes/Main.vue';
import Settings from './../routes/Settings.vue'
import Home from '../routes/Home.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/settings', component: Settings }
  ]
})
