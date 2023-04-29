<script lang="ts" setup>
import { marked } from 'marked'

type ChatMessage = {
  id: string
  text: string
  state: 'pending' | 'success' | 'error'
  createdAt: Date
  sender: 'user' | 'bot'
}

const props = defineProps<{
  messages: ChatMessage[]
}>()

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatMarkdown = (text: string) => {
  return marked.parse(text)
}

</script>
<template>
  <div class="w-full h-full overflow-y-auto overflow-x-hidden p-4">
    <div v-for="message in props.messages" :key="message.id" class="mb-4">
      <div
        class="max-w-3/4 break-words flex items-center"
        :class="{
          'ml-auto': message.sender === 'user',
          'mr-auto': message.sender === 'bot',
        }"
      >
        <span
          v-if="message.sender === 'bot'"
          class="mr-2 text-lg"
          aria-label="robot"
          role="img"
        >
          🤖
        </span>
        <div
          class="rounded-xl p-3 cursor-default"
          :class="{
            'bg-primary-600 ml-auto': message.sender === 'user',
            'bg-gray-100': message.sender === 'bot',
          }"
        >
          <div 
              v-if="message.state === 'success'"
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
        <span
          v-if="message.sender === 'user'"
          class="ml-2 text-lg"
          aria-label="user"
          role="img"
        >
          💬
        </span>
      </div>
      <div
        v-if="message.state !== 'pending'"
        class="text-[10px] text-gray-600 mt-1"
        :class="{
          'text-right pr-10': message.sender === 'user',
          'text-left pl-10': message.sender === 'bot',
        }"
      >
        {{ formatDate(message.createdAt) }}
      </div>
    </div>
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