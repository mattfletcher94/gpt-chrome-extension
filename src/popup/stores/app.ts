import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({ 
        openAIAPIKey: '',
    }),
    actions: {
        init() {
            return new Promise((resolve, reject) => {
                chrome.storage.local.get(['openai-api-key'], (result) => {
                    this.openAIAPIKey = result['openai-api-key']
                    resolve(result)
                });
            });
        },
        setOpenAIApiKey(key: string) {
            return new Promise((resolve, reject) => {
                chrome.storage.local.set({ 'openai-api-key': key }, () => {
                    this.openAIAPIKey = key
                    resolve(key)
                });
            });
        },
    }
});