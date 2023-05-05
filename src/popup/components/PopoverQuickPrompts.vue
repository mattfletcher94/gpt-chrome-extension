<script lang="ts" setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { useAppStore } from '../stores/app';
import IconChevron from './IconChevron.vue';
import { QuickPrompt } from '../types/QuickPrompt';
import { computed } from 'vue';

const appStore = useAppStore();

const promptsSorted = computed(() => appStore.quickPrompts.sort((a, b) => a.title.localeCompare(b.title)))

const emits = defineEmits<{
  (e: 'prompt', prompt: QuickPrompt): void
  (e: 'manage'): void
}>()

</script>

<template>
  <div class="">
    <Popover v-slot="{ open }" class="relative">
      <PopoverButton as="template">
          <slot name="button" />
      </PopoverButton>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <PopoverPanel class="absolute top-0 right-0 transform translate-y-[-100%] z-10 w-[240px] bg-white/90 backdrop-blur-md rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
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
              <!-- Manage quick actions -->
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
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
</template>
