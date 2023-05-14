<script setup lang="ts">
import {
  Dialog,
  DialogOverlay,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { nextTick, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconClose from './IconClose.vue'
import IconSettings from './IconSettings.vue'
import IconChat from './IconChat.vue'
import IconBolt from './IconBolt.vue'

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})
// Emit
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'update:open', isOpen: boolean): void
}>()
const route = useRoute()

const navigation = shallowRef([
  {
    name: 'Chat',
    path: '/',
    icon: IconChat,
  },
  {
    name: 'Quick prompts',
    path: '/quick-prompts/',
    icon: IconBolt,
  },
  {
    name: 'Settings',
    path: '/settings/',
    icon: IconSettings,
  },
])

// Handle close
function handleClose() {
  emit('close')
}

// HTML Refs
const dialogHeader = ref<null | HTMLElement>(null)
const dialogContent = ref<null | HTMLElement>(null)
const dialogFooter = ref<null | HTMLElement>(null)

// Content height
const contentHeight = ref('calc(100%- 4rem')

// Watch open prop
watch(() => props.open, async (open) => {
  if (!open)
    return

  await nextTick()
  const headerHeight = Math.ceil(dialogHeader.value?.getBoundingClientRect().height || 0)
  const footerHeight = Math.ceil(dialogFooter.value?.getBoundingClientRect().height || 0)
  contentHeight.value = `calc(100% - ${headerHeight + footerHeight}px)`
})
</script>

<template>
  <TransitionRoot appear :show="props.open" as="template">
    <Dialog as="template" @close="handleClose()">
      <div class="fixed inset-0 overflow-hidden z-[1000]">
        <div class="flex justify-start h-full w-full">
          <TransitionChild
            as="template"
            enter="duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-300"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay
              class="fixed inset-0 bg-gray-500/70"
            />
          </TransitionChild>
          <TransitionChild
            as="template"
            enter="duration-300 ease-in-out"
            enter-from="opacity-0 -translate-x-1/4"
            enter-to="opacity-100 translate-x-0"
            leave="duration-300 ease-in-out"
            leave-from="opacity-100 translate-x-0"
            leave-to="opacity-0 -translate-x-1/4"
          >
            <div class="relative w-full max-w-[70%] h-full bg-white rounded-tr-2xl rounded-br-2xl shadow-2xl overflow-hidden ring-1 ring-black ring-opacity-5">
              <div ref="dialogHeader" class="flex items-center gap-3 font-medium w-full px-4 h-16 border-b border-b-gray-200">
                <div>
                  <img
                    class="w-[24px] h-[24px] object-contain object-center"
                    src="/logo-128x128.png"
                    alt="Tab GPT logo"
                  >
                </div>
                <div>
                  Menu
                </div>
                <div class="ml-auto shrink-0">
                  <button
                    class="btn btn--light flex items-center justify-center !p-0 h-10 !w-10 rounded-full"
                    @click="handleClose()"
                  >
                    <IconClose class="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div ref="dialogContent" class="block w-full overflow-y-auto overflow-x-hidden" :style="{ height: contentHeight }">
                <div class="block">
                  <router-link
                    v-for="item in navigation"
                    :key="item.name"
                    :to="item.path"
                    class="flex items-center gap-2 w-full p-4 font-normal border-l-2 transition-all duration-200 hover:bg-primary-50 focus-visible:bg-primary-100 hover:text-primary-600 !outline-none"
                    :class="{
                      'border-l-primary-500': route.path === item.path,
                      'border-l-transparent': route.path !== item.path,
                    }"
                    @click="handleClose()"
                  >
                    <div>
                      <component :is="item.icon" class="w-5 h-5" />
                    </div>
                    <div>
                      {{ item.name }}
                    </div>
                  </router-link>
                </div>
              </div>
              <div ref="dialogFooter" class="block w-full p-4 border-t border-t-gray-200">
                <div class="flex items-center" />
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
</style>
