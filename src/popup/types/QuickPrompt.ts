export type QuickPrompt = {
    id: string
    title: string
    prompt: string
    createdAt: string
}

type Prettify<T> = { [K in keyof T]: T[K] extends object ? Prettify<T[K]> : T[K] }

export type QuickPromptCreate = Prettify<Omit<QuickPrompt, 'id' | 'createdAt'>>

export type QuickPromptUpdate = Prettify<Partial<Omit<QuickPrompt, 'id' | 'createdAt'>> & Pick<QuickPrompt, 'id'>>

export type QuickPromptDelete = Prettify<Pick<QuickPrompt, 'id'>>