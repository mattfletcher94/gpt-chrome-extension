import { defineStore } from 'pinia'
import { ChatThread, ChatMessage, ChatThreadCreate, ChatThreadUpdate, ChatThreadDelete, ChatMessageCreate, ChatMessageDelete, ChatMessageUpdate } from '../types/ChatThread';
import { v4 as uuidv4 } from 'uuid'
import { QuickPrompt, QuickPromptCreate, QuickPromptUpdate } from '../types/QuickPrompt';
import { generateDefaultQuickPrompts } from '../data/defaults';

export const useAppStore = defineStore('app', {
    state: () => ({ 
        openaiKey: '',
        chatThreads: [] as ChatThread[],
        chatMessages: [] as ChatMessage[],
        quickPrompts: [] as QuickPrompt[],
    }),
    getters: {
        getOpenaiKey: state => () => state.openaiKey,
        getChatThreads: state => () => state.chatThreads,
        getChatThread: state => (threadId: string) => state.chatThreads.find((t) => t.id === threadId),
        getChatThreadMessages: state => (threadId: string) => state.chatMessages.filter((m) => m.threadId === threadId),
        getChatMessages: state => () => state.chatMessages,
        getChatMessage: state => (messageId: string) => state.chatMessages.find((m) => m.id === messageId),
        isPending: state => () => state.chatMessages.some((m) => m.state === 'pending'),
        getQuickPrompts: state => () => state.quickPrompts,
        getQuickPrompt: state => (quickPromptId: string) => state.quickPrompts.find((q) => q.id === quickPromptId),
    },
    actions: {
        async init() {
            const result = await chrome.storage.local.get({
                openaiKey: '', 
                chatThreads: [] as ChatThread[],
                chatMessages: [] as ChatMessage[],
                quickPrompts: generateDefaultQuickPrompts(),
            });
            const openaiKey = result?.openaiKey || '';
            const chatThreads = (result?.chatThreads || []);
            const chatMessages = (result?.chatMessages || []);
            const quickPrompts = (result?.quickPrompts || generateDefaultQuickPrompts());
            this.openaiKey = openaiKey;

            this.chatThreads = typeof chatThreads === 'string' ? JSON.parse(chatThreads) : chatThreads; 
            this.chatMessages = typeof chatMessages === 'string' ? JSON.parse(chatMessages) : chatMessages;
            // Resolve any pending chat messages and mark them as failed
            this.chatMessages = this.chatMessages.map((m) => {
                if (m.state === 'pending') {
                    return { ...m, state: 'error', text: 'Sorry, the extension was closed while waiting for a response.' };
                }
                return m;
            });
            
            this.quickPrompts = typeof quickPrompts === 'string' ? JSON.parse(quickPrompts) : quickPrompts;
        },
        // Create crud actions for openaiKey
        async setOpenaiKey(key: string) {
            await chrome.storage.local.set({ openaiKey: key });
            this.openaiKey = key;
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
        // Crud actions for quickPrompts
        async createQuickPrompt(quickPrompt: QuickPromptCreate) {
            const newQuickPrompt = { ...quickPrompt, id: uuidv4(), createdAt: new Date().toISOString() };
            await chrome.storage.local.set({ quickPrompts: JSON.stringify([...this.quickPrompts, newQuickPrompt]) });
            this.quickPrompts.push(newQuickPrompt);
            return newQuickPrompt;
        },
        async updateQuickPrompt(quickPrompt: QuickPromptUpdate) {
            const index = this.quickPrompts.findIndex((q) => q.id === quickPrompt.id);
            const updatedQuickPrompt = { ...this.quickPrompts[index], ...quickPrompt, dateUpdated: new Date().toISOString() };
            this.quickPrompts[index] = updatedQuickPrompt;
            await chrome.storage.local.set({ quickPrompts: JSON.stringify(this.quickPrompts) });
            return updatedQuickPrompt;
        },
        async deleteQuickPrompt(quickPromptId: string) {
            this.quickPrompts = this.quickPrompts.filter((q) => q.id !== quickPromptId);
            await chrome.storage.local.set({ quickPrompts: JSON.stringify(this.quickPrompts) });
        },
    }
});