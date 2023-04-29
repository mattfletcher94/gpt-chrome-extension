<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import { computed, ref } from 'vue'
import { useAppStore } from '../stores/app';
import { Configuration, OpenAIApi } from "openai";
import { v4 as uuid } from 'uuid';
import ChatWindow from '../components/ChatWindow.vue';
import IconSettings from '../components/IconSettings.vue';
import { marked } from 'marked'
import TurndownService from 'turndown'

type ChatMessage = {
  id: string
  text: string
  state: 'pending' | 'success' | 'error'
  createdAt: Date
  sender: 'user' | 'bot'
}

const router = useRouter()
const appStore = useAppStore()
const chatMessages = ref<ChatMessage[]>([])

const openai = ref(new OpenAIApi(new Configuration({
  apiKey: appStore.openAIAPIKey,
})));

const pending = computed(() => chatMessages.value.filter(m => m.state === 'pending').length > 0)

async function getWebPageContent() {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    
    const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id as number },
        func: () => document.querySelector('html')?.innerHTML ?? '',
    });
    
    // Parse dom
    const parser = new DOMParser();
    const doc = parser.parseFromString(res.result, 'text/html');

    // Get page title, meta description, and h1
    const title = doc.querySelector('title')?.innerText ?? '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const h1 = doc.querySelector('h1')?.innerText ?? '';
    
    // Get all script tags that use src, and convert them into html strings
    const allScriptTagsThatUseSrc = Array.from(doc.querySelectorAll('script[src]')).map(script => script.outerHTML);
    const allStyleTagsThatUseHref = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]')).map(style => style.outerHTML);

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

    const turndownService = new TurndownService()
    const markdown = turndownService.turndown(doc.body.innerHTML).trim().substring(0, 10000);
    
    return {
        webPageUrl: tab.url ?? '',
        webPageScripts: allScriptTagsThatUseSrc,
        webPageStyles: allStyleTagsThatUseHref,
        webPageTitle: title,
        webPageMetaDescription: description,
        webPageHeading: h1,
        webPageBody: markdown,
    };
}

async function askGPT(prompt: string) {
    const webPageContent = await getWebPageContent();
    console.log(webPageContent);

    chatMessages.value.push({
        id: uuid(),
        text: prompt,
        state: 'success',
        createdAt: new Date(),
        sender: 'user',
    });

    chatMessages.value.push({
        id: uuid(),
        text: '',
        state: 'pending',
        createdAt: new Date(),
        sender: 'bot',
    });

    const completion = await openai.value.createChatCompletion({
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        max_tokens: 500,
        messages: [
            { 
                role: 'system',
                content: 'You will be provided information about a web page. The user will ask you questions about the page and you will answer them. Use markdown to format your response with headings, bullet points, etc. When including links, use the full link for the relative path and ensure to format as markdown.'
            },
            {
                role: 'system',
                content: `Here is the information about the page: 
                    """{
                        webPageURL: "${webPageContent.webPageUrl}",
                        webPageTitle: "${webPageContent.webPageTitle}",
                        webPageMetaDescription: "${webPageContent.webPageMetaDescription}",
                        webPageHeading: "${webPageContent.webPageHeading}",
                        webPageBody: "${webPageContent.webPageBody}"
                    }"""`
            },
            {
                role: 'user',
                content: prompt
            }
        ],
    });
    
    chatMessages.value[chatMessages.value.length - 1].text = completion.data.choices[0].message?.content ?? '';
    chatMessages.value[chatMessages.value.length - 1].state = 'success';
}

/*onMounted(async () => {

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
})*/

</script>
<template>
    <div class="w-full h-full overflow-hidden">
        <TitleBar>
            <template #title>
                <div class="flex items-center gap-4">
                    <div>
                        🤖 What can I do for you?
                    </div>
                    <div class="ml-auto">
                        <button @click="router.push('/settings')" class="p-2 text-gray-700 rounded-full hover:bg-gray-200">
                            <IconSettings class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </template>
        </TitleBar>
        <div class="flex-shrink w-full h-[calc(100%-8rem)]">
            <ChatWindow
                v-if="chatMessages.length > 0"
                :messages="chatMessages"
            />
        </div>
        <div class="h-16">
            <input 
                placeholder="Type something..."
                type="text" 
                class="w-full h-16 px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" 
                @keyup.enter="(e) => askGPT(e.target?.value ?? '')"
            />
        </div>
    </div>
</template>