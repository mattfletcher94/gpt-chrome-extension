<script lang="ts" setup>
import { PopoverButton } from '@headlessui/vue'
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { QuickPrompt } from '../stores/app'
import { useAppStore } from '../stores/app'
import IconChevron from './IconChevron.vue'
import Popover from './Popover.vue'

const props = defineProps({
  width: {
    type: String,
    default: '180px',
  },
  triggerClass: {
    type: String,
    default: '',
  },
  anchor: {
    type: String as PropType<'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end'>,
    default: 'bottom-end',
  },
})

const emits = defineEmits<{
  (e: 'prompt', prompt: QuickPrompt): void
  (e: 'manage'): void
}>()

const appStore = useAppStore()

const promptsSorted = computed(() => [...appStore.quickPrompts].sort((a, b) => a.title.localeCompare(b.title)))
</script>

<template>
  <Popover
    :width="props.width"
    :anchor="anchor"
    :trigger-class="props.triggerClass"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #content>
      <div class="block w-full overflow-hidden">
        <div class="block py-2 max-h-[240px] overflow-y-auto overflow-x-hidden">
          <PopoverButton
            v-for="prompt in promptsSorted"
            :key="prompt.id"
            :title="prompt.prompt"
            class="flex justify-between items-center w-full text-sm font-medium px-4 py-3.5 hover:bg-gray-100 focus-visible:bg-gray-100 cursor-pointer"
            @click="emits('prompt', prompt)"
          >
            {{ prompt.title }}
            <IconChevron direction="right" class="w-4 h-4" />
          </PopoverButton>
        </div>
        <div class="px-4 pb-4">
          <div class="block pt-4 border-t botder-t-gray-200">
            <button
              class="btn btn--gray w-full"
              @click="emits('manage')"
            >
              Manage quick prompts
            </button>
          </div>
        </div>
      </div>
    </template>
  </Popover>
</template>
