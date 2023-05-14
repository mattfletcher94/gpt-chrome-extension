<script lang="ts" setup>
import { marked } from 'marked'
import { computed } from 'vue'
import type { ChatMessage } from '../stores/app'

const props = defineProps<{
  chatMessages: ChatMessage[]
}>()

const chatsSorted = computed(() => {
  return props.chatMessages.map((chat, index) => {
    const showTab = index === 0 || (index > 0 && props.chatMessages[index - 1].tab.url !== chat.tab.url)
    return {
      ...chat,
      showTab,
    }
  })
})

function formatMarkdown(text: string) {
  const renderer = new marked.Renderer()
  renderer.link = (href, title, text) => `<a target="_blank" href="${href}" title="${title}">${text}</a>`
  return marked.parse(text, { renderer })
}
</script>

<template>
  <div class="relative w-full h-auto overflow-hidden p-4">
    <template
      v-for="chat in chatsSorted"
      :key="chat.id"
    >
      <!-- Render thread tab info -->
      <div
        v-if="chat.showTab"
        class="flex justify-center items-center max-w-[66%] mx-auto break-words mb-4"
      >
        <a
          v-tooltip="{ content: chat.tab.url }"
          :href="chat.tab.url"
          target="_blank"
          class="relative flex items-center gap-3 p-3 rounded-xl overflow-hidden cursor-pointer bg-gray-100 hover:bg-gray-200 focus-visible:bg-gray-200 transition-all"
        >
          <img v-if="chat.tab.icon" :src="chat.tab.icon" alt="" class="absolute inset-0 w-full h-full object-fill opacity-20 blur-lg">
          <img v-if="chat.tab.icon" :src="chat.tab.icon" :alt="chat.tab.title" class="w-5 h-5 object-cover object-center">
          <p class="truncate font-medium text-sm">{{ chat.tab.title }}</p>
        </a>
      </div>
      <!-- Render thread messages -->
      <div class="block w-full mb-4">
        <div
          class="flex items-center gap-2"
          :class="{
            'justify-end flex-row-reverse': chat.sender === 'user',
            'justify-start': chat.sender === 'bot',
          }"
        >
          <!-- avatar -->
          <div
            v-if="chat.sender === 'bot'"
            class="text-lg"
            aria-label="robot"
            role="img"
          >
            🤖
          </div>
          <div
            v-else-if="chat.sender === 'user'"
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
              'bg-gradient-to-br from-primary-500 to-primary-600 ml-auto': chat.sender === 'user',
              'bg-gradient-to-br from-gray-100 to-gray-200': chat.sender === 'bot' && chat.state !== 'error',
              'bg-red-100': chat.sender === 'bot' && chat.state === 'error',
            }"
          >
            <div
              v-if="chat.state === 'success' || chat.state === 'error'"
              class="break-words w-full block"
              :class="{
                'prose-card': chat.sender === 'bot',
                'prose-card--dark': chat.sender === 'user',
              }"
              v-html="formatMarkdown(chat.text)"
            />
            <div v-else-if="chat.state === 'pending'">
              <div class="loading-indicator flex justify-center items-center space-x-1">
                <div class="dot animate-bounce h-2 w-2 bg-gray-400 rounded-full" />
                <div class="dot animate-bounce200 h-2 w-2 bg-gray-400 rounded-full" />
                <div class="dot animate-bounce400 h-2 w-2 bg-gray-400 rounded-full" />
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
