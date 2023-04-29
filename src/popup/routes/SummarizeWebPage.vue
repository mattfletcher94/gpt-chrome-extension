<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import { onMounted, ref } from 'vue'
import { useAppStore } from '../stores/app';
import { Configuration, OpenAIApi } from "openai";
import IconBook from '../components/IconBook.vue';
import ChatWindow from '../components/ChatWindow.vue'
import { v4 as uuidv4 } from 'uuid'

type ChatMessage = {
    id: string
    text: string
    createdAt: Date
    sender: 'user' | 'bot'
}


const router = useRouter()
const appStore = useAppStore()

const generatedContent = ref('')
const generatedError = ref('')
const chatMessages = ref<ChatMessage[]>([])

const openai = ref(new OpenAIApi(new Configuration({
  apiKey: appStore.openAIAPIKey,
})));

function goBack() {
    router.push('/')
}

onMounted(async () => {

    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    if (!tab.id)
        return;
    
    const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.querySelector('html')?.innerHTML ?? '',
    });
    
    // Parse dom
    const parser = new DOMParser();
    const doc = parser.parseFromString(res.result, 'text/html');

    // Remove scripts, styles, and svgs
    const scripts = doc.querySelectorAll('script, noscript');
    scripts.forEach(script => script.remove());
    const styles = doc.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(style => style.remove());
    const svgs = doc.querySelectorAll('svg');
    svgs.forEach(svg => svg.remove());
    const iframes = doc.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.remove());
    const navs = doc.querySelectorAll('nav');
    navs.forEach(nav => nav.remove());
    const footers = doc.querySelectorAll('footer');
    footers.forEach(footer => footer.remove());

    // Remove all HTML and just keep the text, max 10k characters
    const text = (doc.querySelector('html')?.innerText ?? '').trim().substring(0, 10000);

    try {
        const completion = await openai.value.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            max_tokens: 500,
            messages: [
                { 
                    // Prompt to summarize a web page
                    role: 'system',
                    content: 'Summarize the content of this web page in a few sentences. Do not include stuff like cookies, privacy policies, etc.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
        });
        //generatedContent.value = completion.data.choices[0].message?.content ?? '';
        chatMessages.value.push({
            id: uuidv4(),
            text: completion.data.choices[0].message?.content ?? '',
            createdAt: new Date(),
            sender: 'bot'
        })
    } catch (error) {
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
                            <IconBook class="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        Summarize Web Page
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