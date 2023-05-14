import type { QuickPrompt } from '../types/QuickPrompt'

export function generateDefaultQuickPrompts(): QuickPrompt[] {
  return [
    {
      id: '1',
      title: 'Summarise',
      prompt: 'Summarise this web page.',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Find links',
      prompt: 'List all the links on this web page.',
      createdAt: new Date().toISOString(),
    },
  ]
}
