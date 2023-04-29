<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import { onMounted, ref } from 'vue'
import { useAppStore } from '../stores/app';
import { Configuration, OpenAIApi } from "openai";
import IconClipboard from '../components/IconClipboard.vue';
import { v4 as uuid } from 'uuid';
import ChatWindow from '../components/ChatWindow.vue';

type ChatMessage = {
  id: string
  text: string
  state: 'pending' | 'success' | 'error'
  createdAt: Date
  sender: 'user' | 'bot'
}

const router = useRouter()
const appStore = useAppStore()

const generatedError = ref('')
const chatMessages = ref<ChatMessage[]>([])

const openai = ref(new OpenAIApi(new Configuration({
  apiKey: appStore.openAIAPIKey,
})));

function prioritizeTextTags(node) {
  const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'P', 'A'];
  let result = '';

  if (node.nodeType === Node.TEXT_NODE) {
    result += node.textContent;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (textTags.includes(node.tagName)) {
      result += node.textContent;
    }
    for (let childNode of node.childNodes) {
      result += prioritizeTextTags(childNode);
    }
  }

  return result;
}

function trimContent(content, maxChars) {
  if (content.length <= maxChars) {
    return content;
  }

  return content.slice(0, maxChars - 1) + '…';
}

function getContent(maxChars = 10000) {
  const prioritizedContent = prioritizeTextTags(document.body);
  return trimContent(prioritizedContent, maxChars);
}

function goBack() {
    router.push('/')
}

onMounted(async () => {

    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    if (!tab.id)
        return;

    const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() ?? '',
    });

    const text = res.result.trim().substring(0, 10000);

    if (text.length === 0)
        return;

    try {

        const message: ChatMessage = {
            id: uuid(),
            text: text,
            state: 'pending',
            createdAt: new Date(),
            sender: 'bot',
        };

        chatMessages.value.push(message);

        const completion = await openai.value.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            max_tokens: 1000,
            messages: [
                { 
                    role: 'system',
                    content: 'You are a text summarizer. The user provides you with some text and you respond ONLY with the summary text. Use markdown to format your response with headings, bullet points, etc.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
        });

        chatMessages.value[chatMessages.value.length - 1].text = completion.data.choices[0].message?.content ?? '';
        chatMessages.value[chatMessages.value.length - 1].state = 'success';

    } catch (error: any) {
        generatedError.value = error.response
    }
})

</script>
<template>
    <div class="w-full h-full overflow-hidden">
        <!-- Toolbar with back-->
        <TitleBar
            :back-button="goBack"
        >
            <template #title>
                <div class="flex items-center gap-2">
                    <div>
                        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white">
                            <IconClipboard class="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        Summarize Highlighted Text
                    </div>
                </div>
            </template>
        </TitleBar>
        <div class="flex-shrink w-full h-[calc(100%-4rem)]">
            <ChatWindow
                :messages="chatMessages"
            />
        </div>

        <!--
        <div class="p-4">
            <p class="text-gray-700 dark:text-gray-300">
                {{ generatedContent }}
            </p>
            <p class="text-red-500">
                <pre>{{ generatedError }}</pre>
            </p>
        </div>
        -->
    </div>
</template>