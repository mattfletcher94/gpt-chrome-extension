<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useAppStore } from '../stores/app';
import { Configuration, OpenAIApi } from "openai";
import { v4 as uuid } from 'uuid';
import ChatWindow from '../components/ChatWindow.vue';
import IconSettings from '../components/IconSettings.vue';
import IconAdd from '../components/IconAdd.vue';
import IconBolt from '../components/IconBolt.vue';
import IconChevron from '../components/IconChevron.vue';
import IconInfo from '../components/IconInfo.vue';
import IconCheck from '../components/IconCheck.vue';
import Popover from '../components/Popover.vue';
import { Readability } from '@mozilla/readability'
// @ts-expect-error missing types
import TurndownService from 'turndown'
import { generatePrompt } from '../prompts';

const router = useRouter()
const appStore = useAppStore()
const hasMounted = ref(false)
const activeThread = ref('')
const prompt = ref('')
const pending = ref(false)
const selectedText = ref('')
const invalidKey = ref(false)
const chatWindowWrapper = ref<HTMLElement>()

const openai = ref(new OpenAIApi(new Configuration({ apiKey: appStore.getOpenaiKey() })));

//const pending = computed(() => chatMessages.value.filter(m => m.state === 'pending').length > 0)

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

    const article = new Readability(doc, {
        charThreshold: 0,
    }).parse();

    // Content as markdown
    const turndownService = new TurndownService()
    const markdown = turndownService.turndown(article?.content ?? '').trim().substring(0, 100000);
    
    return {
        websiteContext: {
            url: tab.url,
            name: (article?.siteName ?? '').replace(/\s\s+/g, ' '),
            title: title,
            metaDescription: description,
        },
        websiteContent: {
            h1: (article?.title ?? '').replace(/\s\s+/g, ' '),
            content: markdown.replace(/\s\s+/g, ' '),
            byline: (article?.byline ?? '').replace(/\s\s+/g, ' '),
        }
    }
}

async function getSelectedText() {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    
    const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id as number },
        func: () => window.getSelection()?.toString() || '',
    });
    
    return res.result.trim();
}

async function handleQuickActionClick(p: string) {
    prompt.value = p
    await askGPT();
}

async function askGPT() {
    if (pending.value || !prompt.value.trim())
        return;

    const webPageContent = await getWebPageContent();

    // IF THER IS A SELECTION, USE THAT AS THE PROMPT.
    // JUST MAKE SURE THE USER KNOWS THIS.

    //if (appStore.analysisMode === 'HIGHLIGHTED_TEXT') {
    //    const highlightedText = await getHighlightedText();
    //    webPageContent.websiteContent.content = highlightedText;
    //}

    const promptValue = prompt.value.trim();
    prompt.value = '';

    // Push user message
    await appStore.createChatMessage({
        threadId: activeThread.value,
        sender: 'user',
        state: 'success',
        text: promptValue,
    })

    // Push bot message as pending
    const { id: botMessageId } = await appStore.createChatMessage({
        threadId: activeThread.value,
        sender: 'bot',
        state: 'pending',
        text: '',
    });
    
    // Scroll to bottom of chatWindow
    if (chatWindowWrapper.value)
        chatWindowWrapper.value.scrollTop = chatWindowWrapper.value.scrollHeight;

    try {
        const completion = await openai.value.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.4,
            messages: [
                { 
                    role: 'system',
                    content: generatePrompt()
                },
                {
                    role: 'system',
                    content: `Here is the information about the page: """${JSON.stringify(webPageContent)}"""`
                },
                {
                    role: 'user',
                    content: promptValue
                }
            ],
        })

        await appStore.updateChatMessage({ 
            id: botMessageId, 
            text: completion.data.choices[0].message?.content ?? '',
            state: 'success' 
        });

    } catch (error: any) {

        let errorMessage = 'Sorry, something went wrong. Please try again.';

        if (!error.response || !error.response.data) {
            errorMessage = 'Sorry, something went wrong. Please try again.';
        }

        else if (error.response.status === 400 && error.response.data.error.code === 'context_length_exceeded') {
            errorMessage = 'Sorry, this web page is too long for me to read. Please select a smaller portion of the web page and try again.';
        }

        else if (error.response.status === 402 && error.response.data.error.code === 'too_many_requests') {
            errorMessage = 'Sorry, I am too busy right now. Please try again later.';
        }

        else if (error.response.status === 402 && error.response.data.error.code === 'insufficient_funds') {
            errorMessage = 'It looks like you have run out of credits. Please top up your OpenAI account and try again.';
        }

        // Incorrect api key
        else if (error.response.status === 401) {
            invalidKey.value = true;
            errorMessage = 'It looks like your OpenAI API key is mssing or incorrect. Please check your API key and try again.';
        }

        // Set bot message error
        await appStore.updateChatMessage({ 
            id: botMessageId, 
            text: errorMessage,
            state: 'error' 
        });
    } finally {
        // Scroll to bottom of chatWindow
        if (chatWindowWrapper.value)
            chatWindowWrapper.value.scrollTop = chatWindowWrapper.value.scrollHeight;
    }
    
}

onMounted(async () => {

    // Get active tab
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    if (!tab.id)
        return;

    // Create new thread
    const { id } = await appStore.createChatThread({
        title: tab.title || '',
        url: tab.url || '',
        icon: tab.favIconUrl || '',
    });

    // Set active thread
    activeThread.value = id;

    // Get selected text
    selectedText.value = await getSelectedText();

    // Scroll to bottom of chatWindow
    await nextTick() 
    
    if (chatWindowWrapper.value)
        chatWindowWrapper.value.scrollTop = chatWindowWrapper.value.scrollHeight;

    await nextTick()

    hasMounted.value = true;
})

</script>
<template>
    <div class="relative flex flex-col w-full h-full overflow-hidden">
        <div class="absolute top-0 left-0 w-full flex items-center gap-2 h-16 px-4 border-b border-b-gray-200 bg-white/70 backdrop-blur-md rounded-b-2xl z-10">
            <div class="font-medium">
                🤖 tabGPT
            </div>
            <div class="shrink-0 ml-auto">
                <!-- API key status -->
                <div 
                    v-if="appStore.getOpenaiKey() && !invalidKey"
                    class="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-500/10 border border-gray-500/20 text-gray-700"
                    v-tooltip="{ content: 'Your OpenAI API key is connected.' }"
                >
                    <div class="w-2 h-2 rounded-full bg-green-500" />
                    <span>API key connected</span>
                </div>
                <button 
                    v-else
                    class="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-500/10 border border-gray-500/20 text-gray-700"
                    v-tooltip="{ content: 'Your OpenAI API key is missing or invalid.' }"
                    @click="router.push('/settings')"
                >
                    <IconInfo class="w-5 h-5 text-red-500" />
                    <span>API key missing</span>
                    <IconChevron direction="right" class="w-4 h-4" />
                </button>
            </div>
            <!-- Settings button -->
            <div class="shrink-0">
                <button 
                    class="btn btn--light flex items-center justify-center !p-0 h-10 !w-10 rounded-full" 
                    v-tooltip="{ content: 'Settings' }"
                    @click="router.push('/settings')"
                >
                    <IconSettings class="w-5 h-5" />
                </button>
            </div>
        </div>
        <!--
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
        -->
        <!--
        <div class="flex items-center h-12 px-4 gap-4 bg-gray-100">
            <div>
                <p class="text-sm text-gray-700 font-medium">Analysis Mode:</p>
            </div>
            <div class="ml-auto">
                <div class="flex bg-gray-300 rounded-lg transition p-1 dark:bg-gray-700 dark:hover:bg-gray-600">
                    <nav class="flex space-x-2">
                        <button
                            @click="() => updateAnalysisMode('WEB_PAGE')"
                            class="py-1 px-3 inline-flex items-center gap-2 text-sm text-gray-700 font-medium rounded-md transition-all"
                            :class="appStore.analysisMode === 'WEB_PAGE' ? 'bg-white shadow-sm' : 'bg-transparent shadow-none'"
                        >
                            Web Page
                        </button>
                        <button
                            @click="() => updateAnalysisMode('HIGHLIGHTED_TEXT')" 
                            class="py-1 px-3 inline-flex items-center gap-2 text-sm text-gray-500 font-medium rounded-md transition-all" 
                            :class="appStore.analysisMode === 'HIGHLIGHTED_TEXT' ? 'bg-white shadow-sm' : 'bg-transparent shadow-none'"
                        >
                            Selected Text
                        </button>
                    </nav>
                </div>
            </div>
        </div>
        -->
        <div 
            ref="chatWindowWrapper" 
            class="flex-shrink w-full h-full overflow-y-auto overflow-x-hidden pt-16"
            :class="{
                'scroll-smooth': hasMounted,
            }"
        >
            <ChatWindow
                v-if="appStore.chatThreads.length > 0"
                :threads="appStore.chatThreads"
                :messages="appStore.chatMessages"
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
                :disabled="pending"
                v-model="prompt"
                placeholder="Type your question here..."
                type="text" 
                style="box-shadow: none!important;"
                class="w-full h-full !pl-4 !pr-2 py-2 text-gray-700 !font-normal !bg-white !text-base tracking-normal appearance-none !shadow-none !outline-none !border-none !rounded-none focus:bg-white focus:!outline-none focus:!border-none focus:!shadow-none" 
                @keyup.enter="(e) => askGPT()"
            />
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
                <Popover>
                    <template #button>
                        <button
                            :disabled="pending"
                            class="btn btn--secondary flex items-center justify-center !p-0 h-10 !w-10 rounded-full" 
                            v-tooltip="{ content: 'Quick actions' }"
                        >
                            <IconBolt class="w-5 h-5" />
                        </button>
                    </template>
                </Popover>
            </div>
        </div>
    </div>
</template>