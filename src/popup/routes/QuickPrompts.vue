<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { useAppStore } from '../stores/app'
import FormGroup from '../components/FormGroup.vue'
import IconBolt from '../components/IconBolt.vue'
import Checkbox from '../components/Checkbox.vue'
import PopoverConfirm from '../components/PopoverConfirm.vue'
import IconBin from '../components/IconBin.vue'

const router = useRouter()
const appStore = useAppStore()

const list = ref<HTMLDivElement>()
const createdPrompts = ref<string[]>([])

const prompts = computed(() => appStore.quickPrompts)

function handleDeletePrompt(promptId: string) {
  appStore.deleteQuickPrompt(promptId)
}

function handleEditPromptTitle(promptId: string, title: string) {
  appStore.updateQuickPrompt({
    id: promptId,
    title: title.trim() || 'Unamed prompt',
  })
}

function handleEditPromptPrompt(promptId: string, prompt: string) {
  appStore.updateQuickPrompt({
    id: promptId,
    prompt,
  })
}


const handleCreateQuickPromptClick = async () => {

  const createdPrompt = await appStore.createQuickPrompt({
    title: 'New prompt',
    prompt: '',
  })

  createdPrompts.value.push(createdPrompt.id)

  // Find last input and focus it
  await nextTick()

  if (list.value) {
    const lastInput = list.value.querySelector<HTMLDivElement>('li:last-child input')
    if (lastInput)
      lastInput.focus()
  }
}

onUnmounted(() => {
  createdPrompts.value.forEach(async (id) => {
    const prompt = appStore.quickPrompts.find((p) => p.id === id)
    if (!prompt)
      return

    if (prompt.title === 'New prompt' && prompt.prompt === '') {
      await appStore.deleteQuickPrompt(prompt.id)
    }
  })
})

</script>
<template>
    <div class="w-full h-full overflow-hidden">
        <TitleBar :back-button="() => router.push('/')">
            <template #title>
                <div class="w-full flex items-center justify-between gap-2">
                    <div>
                        Manage Quick Prompts
                    </div>
                </div>
            </template>
        </TitleBar>
        <div class="block w-full overflow-x-hidden overflow-y-auto h-[calc(100%-4rem)]">
          <ul ref="list" class="flex flex-col gap-2 w-full">
            <li
              v-for="prompt in prompts"
              :key="prompt.id"
              class="flex items-center px-6 py-4 gap-4 border-b border-b-gray-200"
            >
              <div class="w-full">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium shrink-0 w-20">Title:</p>
                  <input
                    placeholder="Edit label title"
                    type="text"
                    :value="prompt.title"
                    @blur="(e: any) => handleEditPromptTitle(prompt.id, e.target?.value || '')"
                  >
                </div>
                <div class="flex items-start gap-2 mt-4">
                  <p class="text-sm font-medium shrink-0 w-20">Prompt:</p>
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

          <div class="px-4 pb-4">
            <div class="block pt-4">
              <button 
                class="btn btn--gray w-full"
                @click="handleCreateQuickPromptClick"
              >
                  Add quick prompt
                </button>
            </div>
            <div class="block pt-4">
              <button 
                class="btn btn--primary w-full"
                @click="router.push('/')"
              >
                  Done
                </button>
            </div>
          </div>

          <!--
            <div
              v-for="prompt in promptsSorted"
              :key="prompt.id"
              class="flex items-center w-full px-6 py-4 border-b border-b-gray-200"
            >
              <div class="w-full">
                <p class="font-medium b-1">{{ prompt.title }}</p>
                <p class="text-sm text-gray-600">
                  {{ prompt.prompt }}
                </p>
              </div>
              <div class="shrink-0">
                Hello
              </div>
            </div>
          -->
            <!--
            <div class="px-4 pb-4">
              <div class="block pt-4 border-t botder-t-gray-200">
                <button 
                  class="btn btn--secondary w-full"
                >
                    Manage quick prompts
                  </button>
              </div>
            </div>
            -->
          </div>
    </div>
</template>
<style scoped>
.label-textfield {
}
</style>
