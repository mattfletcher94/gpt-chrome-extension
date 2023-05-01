export type ChatMessage = {
    id: string
    threadId: string
    text: string
    state: 'pending' | 'success' | 'error'
    sender: 'user' | 'bot'
    createdAt: string
}

export type ChatThread = {
    id: string
    title: string
    url: string
    icon: string
    createdAt: string
}

type Prettify<T> = { [K in keyof T]: T[K] extends object ? Prettify<T[K]> : T[K] }

export type ChatThreadCreate = Prettify<Omit<ChatThread, 'id' | 'createdAt'>>

export type ChatThreadUpdate = Prettify<Partial<Omit<ChatThread, 'id' | 'createdAt'>> & Pick<ChatThread, 'id'>>

export type ChatThreadDelete = Prettify<Pick<ChatThread, 'id'>>

export type ChatMessageCreate = Prettify<Omit<ChatMessage, 'id' | 'createdAt'>>

export type ChatMessageUpdate = Prettify<Partial<Omit<ChatMessage, 'id' | 'threadId' | 'createdAt'>> & Pick<ChatMessage, 'id'>>

export type ChatMessageDelete = Prettify<Pick<ChatMessage, 'id'>>
