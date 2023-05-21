<script setup lang="ts">
import {
  Dialog,
  DialogOverlay,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { nextTick, ref, shallowRef, watch } from 'vue'
import IconClose from './IconClose.vue'

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

const faqs = shallowRef([
  {
    question: 'How can I acquire an OpenAI API key?',
    answer: 'Obtaining an OpenAI API key is straightforward. First, register for an account on OpenAI\'s platform. After that, you can generate a unique API key by clicking <a class="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer" href="https://platform.openai.com/account/api-keys">here</a>.',
  },
  {
    question: 'What should I do if my OpenAI API key isn\'t functioning?',
    answer: 'To ensure your API key works correctly, confirm that you\'ve added your billing information on the <a class="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer" href="https://platform.openai.com/account/billing/overview">OpenAI Billing</a> page. Remember, your API key won\'t work without the billing info.',
  },
  {
    question: 'What\'s the cost of using OpenAI?',
    answer: 'The cost of using OpenAI\'s ChatGPT API is extremely reasonable. You are billed only for the resources you consume. To provide an estimate, you get approximately 100,000 words per $1. You can find more details about <a class="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer" href="https://openai.com/pricing#language-models">the pricing here</a>.',
  },
  {
    question: 'How is my API key secured in Tab GPT?',
    answer: 'In Tab GPT, your API key is safely stored on your device. As this is a static application without a backend, all data remains in your browser\'s local storage. Any requests made to OpenAI\'s API originate directly from your current browser (you can confirm this by checking the Network tab in your console).',
  },
  {
    question: 'Is it safe to share my OpenAI API key with Tab GPT?',
    answer: 'Absolutely! Tab GPT only keeps your API Key on your local device and doesn\'t transmit it elsewhere. OpenAI sanctions scenarios where the API key is locally stored on the user\'s device. For additional reassurance, you can refer to this <a class="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer" href="https://community.openai.com/t/openais-bring-your-own-key-policy/14538/4">official response from OpenAI\'s staff</a>.',
  },
  {
    question: 'Which model is employed by Tab GPT?',
    answer: 'At present, Tab GPT uses the GPT-3 turbo model. As soon as GPT-4 access is available, we\'ll incorporate it into our platform.',
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
        <div class="flex flex-col justify-end h-full w-full">
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
            enter-from="opacity-0 translate-y-1/4"
            enter-to="opacity-100 translate-y-0"
            leave="duration-300 ease-in-out"
            leave-from="opacity-100 translate-y-0"
            leave-to="opacity-0 translate-y-1/4"
          >
            <div class="relative w-full h-full max-h-[90%] bg-white rounded-t-2xl shadow-2xl overflow-hidden ring-1 ring-black ring-opacity-5">
              <div ref="dialogHeader" class="flex items-center gap-3 font-medium w-full px-4 h-16 border-b border-b-gray-200">
                <div>
                  FAQ's
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
                <details
                  v-for="faq in faqs"
                  :key="faq.question"
                  class="block w-full border-b border-b-gray-200"
                >
                  <summary class="cursor-pointer font-normal px-4 py-4 bg-white hover:bg-gray-100 transition-colors">
                    {{ faq.question }}
                  </summary>
                  <div class="p-4 border-t border-t-gray-200 text-sm text-gray-500" v-html="faq.answer" />
                </details>
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
