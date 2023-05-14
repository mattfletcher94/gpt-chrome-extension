<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, nextTick, onMounted, ref } from 'vue'
import { Configuration, OpenAIApi } from 'openai'
import { Readability } from '@mozilla/readability'

// @ts-expect-error missing types
import TurndownService from 'turndown'
import { PopoverButton } from '@headlessui/vue'
import type { QuickPrompt } from '../stores/app'
import { useAppStore } from '../stores/app'
import ChatWindow from '../components/ChatWindow.vue'
import IconBolt from '../components/IconBolt.vue'
import IconChevron from '../components/IconChevron.vue'
import IconInfo from '../components/IconInfo.vue'
import PopoverQuickPrompts from '../components/PopoverQuickPrompts.vue'
import { generatePrompt } from '../prompts'
import IconMenu from '../components/IconMenu.vue'
import IconEllipsis from '../components/IconEllipsis.vue'
import Popover from '../components/Popover.vue'

const router = useRouter()
const appStore = useAppStore()
const hasMounted = ref(false)
const prompt = ref('')
const selectedText = ref('')
const invalidKey = ref(false)
const chatWindowWrapper = ref<HTMLElement>()

const pending = computed(() => appStore.chatMessages.filter(m => m.state === 'pending').length > 0)

async function getWebPageContent() {
  const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })

  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id as number },
    func: () => document.querySelector('html')?.innerHTML ?? '',
  })

  // Parse dom
  const parser = new DOMParser()
  const doc = parser.parseFromString(res.result, 'text/html')

  // Get page title, meta description, and h1
  const title = doc.querySelector('title')?.innerText ?? ''
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''

  const article = new Readability(doc, {
    charThreshold: 0,
  }).parse()

  // Content as markdown
  const turndownService = new TurndownService()
  const markdown = turndownService.turndown(article?.content ?? '').trim().substring(0, 100000)

  return {
    websiteContext: {
      url: tab.url,
      name: (article?.siteName ?? '').replace(/\s\s+/g, ' '),
      title,
      metaDescription: description,
    },
    websiteContent: {
      h1: (article?.title ?? '').replace(/\s\s+/g, ' '),
      content: markdown.replace(/\s\s+/g, ' '),
      byline: (article?.byline ?? '').replace(/\s\s+/g, ' '),
    },
  }
}

async function getSelectedText() {
  const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })

  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id as number },
    func: () => window.getSelection()?.toString() || '',
  })

  return res.result.trim()
}

async function runQuickPrompt(p: QuickPrompt) {
  prompt.value = p.prompt
  await askGPT()
}

async function askGPT() {
  if (pending.value || !prompt.value.trim())
    return

  const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })

  const webPageContent = await getWebPageContent()

  // IF THER IS A SELECTION, USE THAT AS THE PROMPT.
  // JUST MAKE SURE THE USER KNOWS THIS.
  const highlightedText = await getSelectedText()
  const highlightedTextTrimmed = highlightedText.trim()
  selectedText.value = highlightedTextTrimmed
  if (selectedText.value.length > 0)
    webPageContent.websiteContent.content = selectedText.value

  const promptValue = prompt.value.trim()
  prompt.value = ''

  // Push user message
  await appStore.createChatMessage({
    sender: 'user',
    state: 'success',
    text: promptValue,
    tab: {
      title: tab.title || 'Unkown',
      url: tab.url || '',
      icon: (!tab.favIconUrl || tab.favIconUrl.endsWith('.ico')) ? '' : tab.favIconUrl,
    },
  })

  // Push bot message as pending
  const { id: botMessageId } = await appStore.createChatMessage({
    sender: 'bot',
    state: 'pending',
    text: '',
    tab: {
      title: tab.title || 'Unkown',
      url: tab.url || '',
      icon: (!tab.favIconUrl || tab.favIconUrl.endsWith('.ico')) ? '' : tab.favIconUrl,
    },
  })

  // Scroll to bottom of chatWindow
  if (chatWindowWrapper.value)
    chatWindowWrapper.value.scrollTop = chatWindowWrapper.value.scrollHeight

  try {
    const openai = new OpenAIApi(new Configuration({ apiKey: appStore.getOpenaiKey() }))
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: generatePrompt(),
        },
        {
          role: 'system',
          content: `Here is the information about the page: """${JSON.stringify(webPageContent)}"""`,
        },
        {
          role: 'user',
          content: promptValue,
        },
      ],
    })

    await appStore.updateChatMessage({
      id: botMessageId,
      text: completion.data.choices[0].message?.content ?? '',
      state: 'success',
    })
  }
  catch (error: any) {
    let errorMessage = 'Sorry, something went wrong. Please try again.'

    if (!error.response || !error.response.data) {
      errorMessage = 'Sorry, something went wrong. Please try again.'
    }

    else if (error.response.status === 400 && error.response.data.error.code === 'context_length_exceeded') {
      errorMessage = 'Sorry, this web page is too long for me to read. Please select a smaller portion of the web page and try again.'
    }

    else if (error.response.status === 402 && error.response.data.error.code === 'too_many_requests') {
      errorMessage = 'Sorry, I am too busy right now. Please try again later.'
    }

    else if (error.response.status === 402 && error.response.data.error.code === 'insufficient_funds') {
      errorMessage = 'It looks like you have run out of credits. Please top up your OpenAI account and try again.'
    }

    // Incorrect api key
    else if (error.response.status === 401) {
      invalidKey.value = true
      errorMessage = 'It looks like your OpenAI API key is mssing or incorrect. Please check your API key and try again.'
    }

    // Set bot message error
    await appStore.updateChatMessage({
      id: botMessageId,
      text: errorMessage,
      state: 'error',
    })
  }
  finally {
    // Scroll to bottom of chatWindow
    if (chatWindowWrapper.value)
      chatWindowWrapper.value.scrollTop = chatWindowWrapper.value.scrollHeight
  }
}

onMounted(async () => {
  // Get selected text
  const highlightedText = await getSelectedText()
  selectedText.value = highlightedText.trim()

  // Scroll to bottom of chatWindow
  await nextTick()

  if (chatWindowWrapper.value)
    chatWindowWrapper.value.scrollTop = chatWindowWrapper.value.scrollHeight

  await nextTick()

  hasMounted.value = true
})
</script>

<template>
  <div class="relative flex flex-col w-full h-full overflow-hidden">
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
      <div class="shrink-0 ml-auto">
        <!-- API key status -->
        <div
          v-if="appStore.getOpenaiKey() && !invalidKey"
          v-tooltip="{ content: 'Your OpenAI API key is connected.' }"
          class="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-500/10 border border-gray-500/20 text-gray-700"
        >
          <div class="w-2 h-2 rounded-full bg-green-500" />
          <span>API key connected</span>
        </div>
        <button
          v-else
          v-tooltip="{ content: 'Your OpenAI API key is missing or invalid.' }"
          class="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-500/10 border border-gray-500/20 text-gray-700"
          @click="router.push('/settings')"
        >
          <IconInfo class="w-5 h-5 text-red-500" />
          <span>API key missing</span>
          <IconChevron direction="right" class="w-4 h-4" />
        </button>
      </div>
      <!-- Menu button -->
      <div class="shrink-0">
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
    </div>
    <div v-if="selectedText" class="flex items-center gap-2 h-auto p-4 border-t border-t-gray-200 bg-gray-50">
      <div>
        <IconInfo class="w-5 h-5 text-gray-700" />
      </div>
      <p class="text-sm text-gray-700">
        You've selected some text. I'll analyze just  just the selection for more specific insights and faster results.
      </p>
    </div>
    <div class="shrink-0 flex items-center gap-2 h-20 pr-4 bg-white border-t border-t-gray-100 shadow">
      <input
        v-model="prompt"
        :disabled="pending"
        placeholder="Type your question here..."
        type="text"
        style="box-shadow: none!important;"
        class="w-full h-full !pl-4 !pr-2 py-2 text-gray-700 !font-normal !bg-white !text-base tracking-normal appearance-none !shadow-none !outline-none !border-none !rounded-none focus:bg-white focus:!outline-none focus:!border-none focus:!shadow-none"
        @keyup.enter="(e) => askGPT()"
      >
      <div class="flex items-center">
        <button
          :disabled="pending || !prompt"
          title="Send or send with highlighted text only"
          class="btn btn--primary !h-10 !py-0 whitespace-nowrap"
          @click="askGPT"
        >
          SEND
        </button>
      </div>
      <div class="shrink-0">
        <PopoverQuickPrompts
          width="240px"
          anchor="top-end"
          :trigger-class="`${pending ? 'pointer-events-none' : ''}`"
          @prompt="(prompt) => runQuickPrompt(prompt)"
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
