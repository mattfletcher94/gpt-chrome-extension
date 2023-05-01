import { defineStore } from 'pinia'
import { ChatThread, ChatMessage, ChatThreadCreate, ChatThreadUpdate, ChatThreadDelete, ChatMessageCreate, ChatMessageDelete, ChatMessageUpdate } from '../types/ChatThread';
import { v4 as uuidv4 } from 'uuid'

export const useAppStore = defineStore('app', {
    state: () => ({ 
        openaiKey: '',
        analysisMode: 'WEB_PAGE' as 'WEB_PAGE' | 'SELECTED_TEXT',
        chatThreads: [] as ChatThread[],
        chatMessages: [] as ChatMessage[],
    }),
    getters: {
        getOpenaiKey: state => () => state.openaiKey,
        getChatThreads: state => () => state.chatThreads,
        getChatThread: state => (threadId: string) => state.chatThreads.find((t) => t.id === threadId),
        getChatThreadMessages: state => (threadId: string) => state.chatMessages.filter((m) => m.threadId === threadId),
        getChatMessages: state => () => state.chatMessages,
        getChatMessage: state => (messageId: string) => state.chatMessages.find((m) => m.id === messageId),
        isPending: state => () => state.chatMessages.some((m) => m.state === 'pending'),
    },
    actions: {
        async init() {
            const result = await chrome.storage.local.get({
                openaiKey: '', 
                analysisMode: 'WEB_PAGE',
                chatThreads: [] as ChatThread[],
                chatMessages: [] as ChatMessage[],
            });
            const openaiKey = result?.openaiKey || '';
            const analysisMode = result?.analysisMode || 'WEB_PAGE';
            const chatThreads = (result?.chatThreads || []);
            const chatMessages = (result?.chatMessages || []);
            this.openaiKey = openaiKey;
            this.chatThreads = typeof chatThreads === 'string' ? JSON.parse(chatThreads) : chatThreads; 
            this.chatMessages = typeof chatMessages === 'string' ? JSON.parse(chatMessages) : chatMessages;
            this.analysisMode = analysisMode;
        },
        // Create crud actions for openaiKey
        async setOpenaiKey(key: string) {
            await chrome.storage.local.set({ openaiKey: key });
            this.openaiKey = key;
        },
        async setAnalysisMode(mode: 'WEB_PAGE' | 'SELECTED_TEXT') {
            await chrome.storage.local.set({ analysisMode: mode });
            this.analysisMode = mode;
        },
        // Create crud actions for chatThreads
        async createChatThread(thread: ChatThreadCreate) {
            const newThread = { ...thread, id: uuidv4(), createdAt: new Date().toISOString() };
            
            // Only allow a maximum of 20 threads
            // and delete the oldest one if we are at the limit
            if (this.chatThreads.length >= 20) {
                const oldestThread = this.chatThreads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
                await this.deleteChatThread(oldestThread.id);
            }
            
            await chrome.storage.local.set({ chatThreads: JSON.stringify([...this.chatThreads, newThread]) });
            this.chatThreads.push(newThread);
            return newThread;
        },
        async updateChatThread(thread: ChatThreadUpdate) {
            const index = this.chatThreads.findIndex((t) => t.id === thread.id);
            const updatedThread = { ...this.chatThreads[index], ...thread, dateUpdated: new Date().toISOString() };
            this.chatThreads[index] = updatedThread;
            await chrome.storage.local.set({ chatThreads: JSON.stringify(this.chatThreads) });
            return updatedThread;
        },
        async deleteChatThread(threadId: string) {
            this.chatThreads = this.chatThreads.filter((t) => t.id !== threadId);
            this.chatMessages = this.chatMessages.filter((m) => m.threadId !== threadId);
            await chrome.storage.local.set({ chatThreads: JSON.stringify(this.chatThreads) });
            await chrome.storage.local.set({ chatMessages: JSON.stringify(this.chatMessages) });
        },
        // Create crud actions for chatMessages
        async createChatMessage(message: ChatMessageCreate) {
            const newMessage = { ...message, id: uuidv4(), createdAt: new Date().toISOString() };
            await chrome.storage.local.set({ chatMessages: JSON.stringify([...this.chatMessages, newMessage]) });
            this.chatMessages.push(newMessage);
            return newMessage;
        },
        async updateChatMessage(message: ChatMessageUpdate) {
            const index = this.chatMessages.findIndex((m) => m.id === message.id);
            const updatedMessage = { ...this.chatMessages[index], ...message, dateUpdated: new Date().toISOString() };
            this.chatMessages[index] = updatedMessage;
            await chrome.storage.local.set({ chatMessages: JSON.stringify(this.chatMessages) });
            return updatedMessage;
        },
        async deleteChatMessage(messageId: string) {
            this.chatMessages = this.chatMessages.filter((m) => m.id !== messageId);
            await chrome.storage.local.set({ chatMessages: JSON.stringify(this.chatMessages) });
        },
    }
});