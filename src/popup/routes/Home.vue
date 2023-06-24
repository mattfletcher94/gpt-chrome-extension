<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, nextTick, onMounted, ref } from 'vue'
import { PopoverButton } from '@headlessui/vue'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'
import type { QuickPrompt } from '../stores/app'
import { useAppStore } from '../stores/app'
import ChatWindow from '../components/ChatWindow.vue'
import IconBolt from '../components/IconBolt.vue'
import IconInfo from '../components/IconInfo.vue'
import PopoverQuickPrompts from '../components/PopoverQuickPrompts.vue'
import IconMenu from '../components/IconMenu.vue'
import IconEllipsis from '../components/IconEllipsis.vue'
import Popover from '../components/Popover.vue'
import { askGPT } from '../services/ai'
import { webPageContentChromeService } from '../services/webPageContent'

// Composables
const router = useRouter()
const appStore = useAppStore()

// Local state
const hasMounted = ref(false)
const hasSelectedText = ref(false)
const prompt = ref('')

// Template refs
const promptInput = ref<HTMLInputElement>()
const chatWindowWrapper = ref<HTMLElement>()

// Computed
const pending = computed(() => appStore.chatMessages.filter(m => m.state === 'pending').length > 0)

function handleRunQuickPrompt(p: QuickPrompt) {
  prompt.value = p.prompt
  handleAskGPT()
}

async function handleAskGPT() {
  if (pending.value || !prompt.value.trim()) return

  const pageDetails = await webPageContentChromeService.fetchPageDetails()
  const pageContent = await webPageContentChromeService.fetchPageContent()
  const pageSelection = await webPageContentChromeService.fetchPageSelection()

  // Set the selected text value
  hasSelectedText.value = pageSelection.trim().length > 0

  // Get article content and convert to markdown
  const parser = new DOMParser()
  const doc = parser.parseFromString(pageContent, 'text/html')
  const article = new Readability(doc, { charThreshold: 0 }).parse()
  const turndownService = new TurndownService()
  const pageContentMarkdown = turndownService.turndown(article?.content ?? '').trim().substring(0, 100000)

  // Trim the prompt value and clear the original prompt
  const promptValue = prompt.value.trim()
  prompt.value = ''

  // Push user message
  await appStore.createChatMessage({
    sender: 'user',
    state: 'success',
    text: promptValue,
    tab: {
      title: pageDetails.title,
      url: pageDetails.url,
      icon: pageDetails.icon,
    },
  })

  // Push bot message as pending
  const { id: botMessageId } = await appStore.createChatMessage({
    sender: 'bot',
    state: 'pending',
    text: '',
    tab: {
      title: pageDetails.title,
      url: pageDetails.url,
      icon: pageDetails.icon,
    },
  })

  // Scroll to bottom of chatWindow
  handleScrollToBottom()

  // Ask GPT
  const { data, error } = await askGPT({
    prompt: promptValue,
    content: JSON.stringify({
      pageDetails,
      pageContent: hasSelectedText.value ? pageSelection : pageContentMarkdown,
    }),
  })

  // If error, set bot message error
  if (error) {
    await appStore.updateChatMessage({
      id: botMessageId,
      text: error.message,
      state: 'error',
    })
  }

  // If successful
  if (data) {
    await appStore.updateChatMessage({
      id: botMessageId,
      text: data.answer,
      state: 'success',
    })
  }

  // Scroll to bottom of chatWindow
  handleScrollToBottom()
}

function handleScrollToBottom() {
  if (chatWindowWrapper.value)
    chatWindowWrapper.value.scrollTop = chatWindowWrapper.value.scrollHeight
}

onMounted(async () => {
  // Get selected text
  const pageSelection = await webPageContentChromeService.fetchPageSelection()
  hasSelectedText.value = pageSelection.trim().length > 0

  // Scroll to bottom of chatWindow
  await nextTick()
  handleScrollToBottom()
  await nextTick()

  // Focus on prompt input
  if (promptInput.value) promptInput.value.focus()

  hasMounted.value = true
})
</script>

<template>
  <div class="relative flex flex-col w-full h-full overflow-hidden">

    <!-- Header -->
    <div class="absolute top-0 left-0 w-full flex items-center gap-2 h-16 px-4 border-b border-b-gray-200 bg-white/70 backdrop-blur-md rounded-b-2xl z-10">
      <div class="flex items-center gap-3 font-medium">
        <div class="shrink-0">
          <button
            v-tooltip="{ content: 'Menu' }"
            class="btn btn--light flex items-center justify-center !p-0 h-10 !w-10 rounded-full"
            @click="appStore.menuOpen = true"
          >
            <IconMenu class="w-5 h-5" />
          </button>
        </div>
        <div class="border-l border-l-gray-300 pl-4">
          <img
            class="w-[24px] h-[24px] object-contain object-center"
            src="/logo-128x128.png"
            alt="Tab GPT logo"
          >
        </div>
        <div>
          Tab GPT
        </div>
      </div>

      <!-- Menu button -->
      <div class="ml-auto shrink-0">
        <Popover width="180px">
          <template #trigger>
            <button
              v-tooltip="{ content: 'Options' }"
              class="btn btn--light flex items-center justify-center !p-0 h-10 !w-10 rounded-full"
            >
              <IconEllipsis class="w-5 h-5" />
            </button>
          </template>
          <template #content>
            <div class="block w-full overflow-hidden">
              <div class="block py-2 max-h-[240px] overflow-y-auto overflow-x-hidden">
                <PopoverButton
                  class="flex justify-between items-center w-full text-sm font-medium px-4 py-3 hover:bg-gray-100 focus-visible:bg-gray-100 cursor-pointer"
                  @click="appStore.deleteAllChatMessages()"
                >
                  Clear Chat History
                </PopoverButton>
              </div>
            </div>
          </template>
        </Popover>
      </div>
    </div>

    <!-- Chat window -->
    <div
      ref="chatWindowWrapper"
      class="flex-shrink w-full h-full overflow-y-auto overflow-x-hidden pt-16"
      :class="{
        'scroll-smooth': hasMounted,
      }"
    >
      <ChatWindow
        v-if="appStore.chatMessages.length > 0"
        :chat-messages="appStore.chatMessages"
      />

      <!-- Empty state, API key configured -->
      <template v-else>
        <div class="flex items-center justify-center w-full h-full">
          <div class="flex flex-col items-center justify-center gap-4">
            <div class="flex items-center justify-center">
              <img
                class="w-12 h-12 object-cover rounded-full object-center"
                src="/logo-128x128.png"
                alt="Tab GPT logo"
              >
            </div>
            <p class="text-base text-gray-600 text-center">
              Ask me a question about this page and <br>I'll try to answer it.
            </p>
          </div>
        </div>
      </template>
    </div>

    <!-- Selected text banner -->
    <div v-if="hasSelectedText" class="flex items-center gap-2 h-auto p-4 border-t border-t-gray-200 bg-gray-50">
      <div>
        <IconInfo class="w-5 h-5 text-gray-700" />
      </div>
      <p class="text-sm text-gray-700">
        You've selected some text. I'll analyze just  just the selection for more specific insights and faster results.
      </p>
    </div>

    <!-- Footer -->
    <div class="shrink-0 flex items-center gap-2 h-20 pr-4 bg-white border-t border-t-gray-100 shadow">
      <input
        ref="promptInput"
        v-model="prompt"
        :disabled="pending"
        placeholder="Type your question here..."
        type="text"
        style="box-shadow: none!important;"
        class="w-full h-full !pl-4 !pr-2 py-2 text-gray-700 !font-normal !bg-white !text-base tracking-normal appearance-none !shadow-none !outline-none !border-none !rounded-none focus:bg-white focus:!outline-none focus:!border-none focus:!shadow-none"
        @keyup.enter="handleAskGPT"
      >
      <div class="flex items-center">
        <button
          :disabled="pending || !prompt"
          title="Send or send with highlighted text only"
          class="btn btn--primary !h-10 !py-0 whitespace-nowrap"
          @click="handleAskGPT"
        >
          SEND
        </button>
      </div>
      <div class="shrink-0">
        <PopoverQuickPrompts
          width="240px"
          anchor="top-end"
          :trigger-class="`${pending ? 'pointer-events-none' : ''}`"
          @prompt="(prompt) => handleRunQuickPrompt(prompt)"
          @manage="() => router.push('/quick-prompts')"
        >
          <template #trigger>
            <button
              v-tooltip="{ content: 'Quick prompts' }"
              :disabled="pending"
              class="btn btn--secondary flex items-center justify-center !p-0 h-10 !w-10 rounded-full"
            >
              <IconBolt class="w-5 h-5" />
            </button>
          </template>
        </PopoverQuickPrompts>
      </div>
    </div>
  </div>
</template>
