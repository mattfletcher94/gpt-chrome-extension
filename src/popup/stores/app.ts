import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({ 
        openAIAPIKey: '',
    }),
    actions: {
        async init() {
            const result = await chrome.storage.local.get(['openai-api-key']);
            this.openAIAPIKey = result['openai-api-key']
        },
        async setOpenAIApiKey(key: string) {
            await chrome.storage.local.set({ 'openai-api-key': key });
            this.openAIAPIKey = key
        },
    }
});