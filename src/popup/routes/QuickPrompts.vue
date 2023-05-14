<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { QuickPrompt } from '../stores/app'
import { useAppStore } from '../stores/app'
import PopoverConfirm from '../components/PopoverConfirm.vue'
import IconBin from '../components/IconBin.vue'
import IconMenu from '../components/IconMenu.vue'
import IconBolt from '../components/IconBolt.vue'

const appStore = useAppStore()

const list = ref<HTMLDivElement>()

const prompts = ref<Array<QuickPrompt & { deleted?: boolean }>>(JSON.parse(JSON.stringify(appStore.quickPrompts)))
const savingText = ref('Save changes')

function handleDeletePrompt(promptId: string) {
  const prompt = prompts.value.find(p => p.id === promptId)
  if (!prompt)
    return
  prompt.deleted = true
}

function handleEditPromptTitle(promptId: string, title: string) {
  if (title.trim() === '')
    return
  const prompt = prompts.value.find(p => p.id === promptId)
  if (!prompt)
    return

  prompt.title = title.trim() || 'Unamed prompt'
}

function handleEditPromptPrompt(promptId: string, prompt: string) {
  const promptObj = prompts.value.find(p => p.id === promptId)
  if (!promptObj)
    return
  promptObj.prompt = prompt
}

async function handleCreateQuickPromptClick() {
  prompts.value.push({
    id: uuidv4(),
    title: 'New prompt',
    prompt: '',
    createdAt: new Date().toISOString(),
  })

  // Find last input and focus it
  await nextTick()

  if (list.value) {
    const lastInput = list.value.querySelector<HTMLDivElement>('li:last-child input')
    if (lastInput)
      lastInput.focus()
  }
}

async function handleSaveChanges() {
  const existsingPrompts = appStore.quickPrompts
  const deletedPrompts = prompts.value.filter(p => p.deleted === true)
  const updatedPrompts = prompts.value.filter(p => p.deleted !== true && existsingPrompts.find(ep => ep.id === p.id))
  const createdPrompts = prompts.value.filter(p => p.deleted !== true && !existsingPrompts.find(ep => ep.id === p.id))

  // First, delete all deleted prompts
  await Promise.all(deletedPrompts.map(p => appStore.deleteQuickPrompt(p.id)))

  // Upadte any prompts that are existing in store
  await Promise.all(updatedPrompts.map(p => appStore.updateQuickPrompt({
    id: p.id,
    title: p.title,
    prompt: p.prompt,
  })))

  // Create any prompts that are not existing in store
  await Promise.all(createdPrompts.map(p => appStore.createQuickPrompt({
    title: p.title,
    prompt: p.prompt,
  })))

  savingText.value = 'Saved!'
  setTimeout(() => {
    savingText.value = 'Save changes'
  }, 1000)
}
</script>

<template>
  <div class="relative flex flex-col w-full h-full overflow-hidden">
    <div class="absolute top-0 left-0 w-full flex items-center gap-2 h-16 px-4 border-b border-b-gray-200 bg-white/70 backdrop-blur-md rounded-b-2xl z-10">
      <div class="flex items-center gap-3 font-medium">
        <div class="shrink-0">
          <button
            v-tooltip="{ content: 'Menu' }"
            class="btn btn--light flex items-center justify-center !p-0 h-10 !w-10 rounded-full"
            @click="appStore.menuOpen = true"
          >
            <IconMenu class="w-5 h-5" />
          </button>
        </div>
        <div class="border-l border-l-gray-300 pl-4">
          <IconBolt class="w-5 h-5" />
        </div>
        <div>
          Quick Prompts
        </div>
      </div>
    </div>
    <div class="flex-shrink w-full h-full overflow-y-auto overflow-x-hidden pt-16">
      <ul ref="list" class="flex flex-col gap-2 w-full">
        <li
          v-for="prompt in prompts.filter(p => p.deleted !== true)"
          :key="prompt.id"
          class="flex items-center px-6 py-4 gap-4 border-b border-b-gray-200"
        >
          <div class="w-full">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium shrink-0 w-20">
                Title:
              </p>
              <input
                placeholder="Edit label title"
                type="text"
                :value="prompt.title"
                @blur="(e: any) => handleEditPromptTitle(prompt.id, e.target?.value || '')"
              >
            </div>
            <div class="flex items-start gap-2 mt-4">
              <p class="text-sm font-medium shrink-0 w-20">
                Prompt:
              </p>
              <textarea
                class="resize-none w-full"
                placeholder="Edit label title"
                :rows="2"
                :value="prompt.prompt"
                @blur="(e: any) => handleEditPromptPrompt(prompt.id, e.target?.value || '')"
              />
            </div>
          </div>
          <div class="shrink-0">
            <PopoverConfirm
              trigger-class="btn btn--light !px-2 !text-slate-500 !py-0 !h-8"
              message="Are you sure you want to delete this quick prompt?"
              width="240px"
              confirm-text="Delete"
              cancel-text="Cancel"
              @confirm="() => handleDeletePrompt(prompt.id)"
            >
              <template #trigger>
                <IconBin class="w-4 h-4" />
              </template>
            </PopoverConfirm>
          </div>
        </li>
      </ul>
    </div>
    <div class="shrink-0 flex items-center justify-end gap-2 p-4 bg-white border-t border-t-gray-100 shadow">
      <button
        class="btn btn--gray w-full"
        @click="handleCreateQuickPromptClick"
      >
        Add quick prompt
      </button>
      <button
        class="btn btn--primary w-full"
        :disabled="savingText !== 'Save changes'"
        @click="handleSaveChanges()"
      >
        {{ savingText }}
      </button>
    </div>
  </div>
</template>
