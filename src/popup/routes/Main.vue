<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import TitleBar from '../components/TitleBar.vue';
import IconBook from '../components/IconBook.vue';
import IconChat from '../components/IconChat.vue';
import IconDocumentFind from '../components/IconDocumentFind.vue';
import IconSettings from '../components/IconSettings.vue';
import IconError from '../components/IconError.vue';
import IconClipboard from '../components/IconClipboard.vue';
import { useAppStore } from '../stores/app';

const appStore = useAppStore();

const router = useRouter();

const actions = ref([
    {
        id: 'summarize-web-page',
        name: 'Summarize Web Page',
        action: summarizeWebPage,
    },
    {
        id: 'summarize-highlighted-text',
        name: 'Summarize Highlighted Text',
        action: summarizeHighlightedText,
    },
    {
        id: 'smart-question-answering',
        name: 'Smart Question Answering',
        action: smartQuestionAnswering
    },
    {
        id: 'content-extraction',
        name: 'Content Extraction',
        action: contentExtraction
    },
    {
        id: 'settings',
        name: 'Settings',
        action: settings
    }
] as const)

function summarizeWebPage() {
    router.push('/summarize-web-page');
}

function summarizeHighlightedText() {
    router.push('/summarize-highlighted-text');
}

function smartQuestionAnswering() {
    // Implement the smart question-answering feature here
}

function contentExtraction() {
    // Implement the content extraction feature here
}

function settings() {
    router.push('/settings');
}

</script>
<template>
    <div class="h-full w-full overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900">
        <TitleBar>
            <template #title>
                <div class="flex items-center gap-4">
                    <div>
                        What can I do for you?
                    </div>
                    <div class="ml-auto">
                        <button @click="settings" class="p-2 text-gray-700 rounded-full hover:bg-gray-200">
                            <IconSettings class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </template>
        </TitleBar>
        <div class="p-4">

            <div>

                <!-- You need to configure your open ai api key -->
                <div v-if="!appStore.openAIAPIKey" class="w-full border border-red-800 bg-red-50 px-4 py-2 rounded-lg dark:bg-gray-800 ">
                    <div class="flex items-start gap-2">
                        <div>
                            <IconError class="block w-6 h-6 text-red-800" />
                        </div>
                        <p class="text-left font-normal text-sm text-red-800 dark:text-gray-100 leading-tight">
                            You need to add your OpenAI API key to use this extension.
                        </p>
                        <button
                            class="ml-auto px-3 py-1.5 whitespace-nowrap rounded-lg bg-red-100 text-red-800 font-medium text-sm hover:bg-red-200 focus-visible:bg-red-200"
                            @click="settings"
                        >
                            Setup >
                        </button>
                    </div>
                </div>
            </div>
        
            <div class="grid grid-cols-2 gap-4 mt-4">
                <button
                    v-for="action in actions"
                    :key="action.id"
                    @click="action.action"
                    class="h-24 border border-gray-200 p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-primary-50 hover:border-primary-500 focus-visible:bg-primary-50 focus-visible:border-primary-500 focus:outline-none focus-visible:ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50 transition-colors"
                >
                    <div class="flex flex-col items-center gap-2">
                        <div class="flex items-center justify-center bg-primary-500 text-white rounded-full w-8 h-8">
                            <IconBook v-if="action.id == 'summarize-web-page'" class="w-5 h-5" />
                            <IconClipboard v-if="action.id == 'summarize-highlighted-text'" class="w-5 h-5" />
                            <IconChat v-else-if="action.id == 'smart-question-answering'" class="w-5 h-5"  />
                            <IconDocumentFind v-else-if="action.id == 'content-extraction'" class="w-5 h-5"  />
                            <IconSettings v-else-if="action.id == 'settings'" class="w-5 h-5"  />
                        </div>
                        <p class="font-normal text-sm text-gray-800 dark:text-gray-100 leading-tight">
                            {{ action.name }}
                        </p>
                    </div>
                </button>
            </div>

        </div>
    </div>
</template>
  
  