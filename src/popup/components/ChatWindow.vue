<script lang="ts" setup>
import { marked } from 'marked'
import { ChatMessage, ChatThread } from '../types/ChatThread'
import { computed } from 'vue'

const props = defineProps<{
  threads: ChatThread[]
  messages: ChatMessage[]
}>()

const populatedThreads = computed(() => {
  return props.threads.map((thread) => {
    const messages = props.messages.filter((message) => message.threadId === thread.id)
    return {
      ...thread,
      messages,
    }
  }).filter((thread) => thread.messages.length > 0)
})

const formatMarkdown = (text: string) => {
  const renderer = new marked.Renderer();
  renderer.link = ( href, title, text ) => `<a target="_blank" href="${ href }" title="${ title }">${ text }</a>`;
  return marked.parse(text, { renderer })
}

</script>
<template>
  <div class="relative w-full h-auto overflow-hidden p-4">
    <template
      v-for="thread in populatedThreads"
      :key="thread.id"
    >
      <!-- Render thread tab info -->
      <div class="flex justify-center items-center max-w-[66%] mx-auto break-words mb-4">
        <a
          :href="thread.url"
          v-tooltip='{ content: thread.url }'
          target="_blank" 
          class="relative flex items-center gap-3 p-3 rounded-xl overflow-hidden cursor-pointer bg-gray-100 hover:bg-gray-200 focus-visible:bg-gray-200 transition-all"
        >
          <img :src="thread.icon" alt="" class="absolute inset-0 w-full h-full object-fill opacity-20 blur-lg" />
          <img :src="thread.icon" :alt="thread.title" class="w-5 h-5 object-cover object-center" />
          <p class="truncate font-medium text-sm">{{ thread.title }}</p>
        </a>
      </div>
      <!-- Render thread messages -->
      <div 
        v-for="message in thread.messages"
        :key="message.id"
        class="block w-full mb-4"
      >
        <div 
          class="flex items-center gap-2"
          :class="{
            'justify-end flex-row-reverse': message.sender === 'user',
            'justify-start': message.sender === 'bot',
          }"  
        >
          <!-- avatar -->
          <div
            v-if="message.sender === 'bot'"
            class="text-lg"
            aria-label="robot"
            role="img"
          >
            🤖
          </div>
          <div 
            v-else-if="message.sender === 'user'"
            class="text-lg"
            aria-label="user"
            role="img"
          >
            💬
          </div>
          <!-- Message -->
          <div
            class="rounded-xl p-3 max-w-full overflow-hidden cursor-default"
            :class="{
              'bg-gradient-to-br from-primary-500 to-primary-600 ml-auto': message.sender === 'user',
              'bg-gradient-to-br from-gray-100 to-gray-200': message.sender === 'bot' && message.state !== 'error',
              'bg-red-100': message.sender === 'bot' && message.state === 'error',
            }"
          >
            <div 
                v-if="message.state === 'success' || message.state === 'error'"
                class="break-words w-full block"
                :class="{
                  'prose-card': message.sender === 'bot',
                  'prose-card--dark': message.sender === 'user',
                }"
                v-html="formatMarkdown(message.text)"
              >
            </div>
            <div v-else-if="message.state === 'pending'">
              <div class="loading-indicator flex justify-center items-center space-x-1">
                <div class="dot animate-bounce h-2 w-2 bg-gray-400 rounded-full"></div>
                <div class="dot animate-bounce200 h-2 w-2 bg-gray-400 rounded-full"></div>
                <div class="dot animate-bounce400 h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.loading-indicator .dot {
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-iteration-count: infinite;
}

.loading-indicator .dot.animate-bounce {
  animation-name: bounce;
}

.loading-indicator .dot.animate-bounce200 {
  animation-name: bounce;
  animation-delay: 0.15s;
}

.loading-indicator .dot.animate-bounce400 {
  animation-name: bounce;
  animation-delay: 0.3s;
}
</style>