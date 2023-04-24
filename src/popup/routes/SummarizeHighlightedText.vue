<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import { onMounted, ref } from 'vue'
import { useAppStore } from '../stores/app';
import { Configuration, OpenAIApi } from "openai";

const router = useRouter()
const appStore = useAppStore()

const generatedContent = ref('')
const generatedError = ref('')

const openai = ref(new OpenAIApi(new Configuration({
  apiKey: appStore.openAIAPIKey,
})));

function goBack() {
    router.push('/')
}

onMounted(async () => {

    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() ?? '',
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

    // Remove all HTML and just keep the text max 10k characters
    const text = (doc.querySelector('html')?.innerText ?? '').trim().substring(0, 10000);

    if (text.length === 0) {
        return;
    }

    try {
        const completion = await openai.value.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            max_tokens: 500,
            messages: [
                { 
                    // Prompt to summarize a web page
                    role: 'system',
                    content: 'Summarize this text.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
        });
        generatedContent.value = completion.data.choices[0].message?.content ?? '';
    } catch (error) {
        generatedError.value = error.response
    }
})

</script>
<template>
    <div class="w-full h-full overflow-x-hidden overflow-y-auto">
        <!-- Toolbar with back-->
        <TitleBar
            :back-button="goBack"
        >
            <template #title>
                <div class="flex items-center gap-2">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-blue-500 w-5 h-5 block">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                    </div>
                    <div>
                        Summarize Web Page
                    </div>
                </div>
            </template>
        </TitleBar>
        <div class="p-4">
            <p class="text-gray-700 dark:text-gray-300">
                {{ generatedContent }}
            </p>
            <p class="text-red-500">
                <pre>{{ generatedError }}</pre>
            </p>
        </div>
    </div>
</template>