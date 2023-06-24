import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { generateDefaultQuickPrompts } from '../data/defaults'

export interface ChatMessage {
  id: string
  text: string
  state: 'pending' | 'success' | 'error'
  sender: 'user' | 'bot'
  createdAt: string
  tab: {
    title: string
    url: string
    icon: string
  }
}

export type ChatMessageCreate = Omit<ChatMessage, 'id' | 'createdAt'>

export type ChatMessageUpdate = Partial<Omit<ChatMessage, 'id' | 'createdAt'> & Pick<ChatMessage, 'id'>>

export interface QuickPrompt {
  id: string
  title: string
  prompt: string
  createdAt: string
}

type Prettify<T> = { [K in keyof T]: T[K] extends object ? Prettify<T[K]> : T[K] }

export type QuickPromptCreate = Prettify<Omit<QuickPrompt, 'id' | 'createdAt'>>

export type QuickPromptUpdate = Prettify<Partial<Omit<QuickPrompt, 'id' | 'createdAt'>> & Pick<QuickPrompt, 'id'>>

export type QuickPromptDelete = Prettify<Pick<QuickPrompt, 'id'>>

export const useAppStore = defineStore('app', {
  state: () => ({
    menuOpen: false,
    chatMessages: [] as ChatMessage[],
    quickPrompts: [] as QuickPrompt[],
  }),
  getters: {
    isPending: state => () => state.chatMessages.some(m => m.state === 'pending'),
    getQuickPrompts: state => () => state.quickPrompts,
    getQuickPrompt: state => (quickPromptId: string) => state.quickPrompts.find(q => q.id === quickPromptId),
  },
  actions: {
    async init() {
      const result = await chrome.storage.local.get({
        openaiKey: '',
        chatMessages: [] as ChatMessage[],
        quickPrompts: generateDefaultQuickPrompts(),
      })

      const chatMessages = typeof result.chatMessages === 'string' ? JSON.parse(result.chatMessages) : result.chatMessages
      const quickPrompts = typeof result.quickPrompts === 'string' ? JSON.parse(result.quickPrompts) : result.quickPrompts

      this.chatMessages = chatMessages
      this.quickPrompts = quickPrompts

      // Resolve any pending chat messages and mark them as failed
      this.chatMessages = this.chatMessages.map((m) => {
        if (m.state === 'pending')
          return { ...m, state: 'error', text: 'The extension was closed while waiting for a response.' }
        return m
      })
    },

    // Crud actions for quickPrompts
    async createQuickPrompt(quickPrompt: QuickPromptCreate) {
      const newQuickPrompt = { ...quickPrompt, id: uuidv4(), createdAt: new Date().toISOString() }
      await chrome.storage.local.set({ quickPrompts: JSON.stringify([...this.quickPrompts, newQuickPrompt]) })
      this.quickPrompts.push(newQuickPrompt)
      return newQuickPrompt
    },
    async updateQuickPrompt(quickPrompt: QuickPromptUpdate) {
      const index = this.quickPrompts.findIndex(q => q.id === quickPrompt.id)
      const updatedQuickPrompt = { ...this.quickPrompts[index], ...quickPrompt, dateUpdated: new Date().toISOString() }
      this.quickPrompts[index] = updatedQuickPrompt
      await chrome.storage.local.set({ quickPrompts: JSON.stringify(this.quickPrompts) })
      return updatedQuickPrompt
    },
    async deleteQuickPrompt(quickPromptId: string) {
      this.quickPrompts = this.quickPrompts.filter(q => q.id !== quickPromptId)
      await chrome.storage.local.set({ quickPrompts: JSON.stringify(this.quickPrompts) })
    },

    // Crud actions for chat messages
    async createChatMessage(chat: ChatMessageCreate) {
      const newChat = { ...chat, id: uuidv4(), createdAt: new Date().toISOString() }
      this.chatMessages.push(newChat)
      await chrome.storage.local.set({ chatMessages: JSON.stringify(this.chatMessages) })
      return newChat
    },
    async updateChatMessage(chat: ChatMessageUpdate) {
      const index = this.chatMessages.findIndex(c => c.id === chat.id)
      const updatedChat = { ...this.chatMessages[index], ...chat, dateUpdated: new Date().toISOString() }
      this.chatMessages[index] = updatedChat
      await chrome.storage.local.set({ chatMessages: JSON.stringify(this.chatMessages) })
      return updatedChat
    },
    async deleteChatMessage(chatId: string) {
      this.chatMessages = this.chatMessages.filter(c => c.id !== chatId)
      await chrome.storage.local.set({ chatMessages: JSON.stringify(this.chatMessages) })
    },
    async deleteAllChatMessages() {
      this.chatMessages = []
      await chrome.storage.local.set({ chatMessages: JSON.stringify(this.chatMessages) })
    },
  },
})
