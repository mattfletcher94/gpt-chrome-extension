import { createRouter, createWebHashHistory } from 'vue-router';
import Main from './../routes/Main.vue';
import SummarizeWebPage from './../routes/SummarizeWebPage.vue'
import SummarizeHighlightedText from './../routes/SummarizeHighlightedText.vue'
import Settings from './../routes/Settings.vue'
import Home from '../routes/Home.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/summarize-web-page', component: SummarizeWebPage },
    { path: '/summarize-highlighted-text', component: SummarizeHighlightedText },
    { path: '/settings', component: Settings }
  ]
})
