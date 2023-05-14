<script lang="ts" setup>
import { PopoverButton } from '@headlessui/vue'
import type { PropType } from 'vue'
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
  message: {
    type: String,
    default: 'Are you sure?',
  },
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  anchor: {
    type: String as PropType<'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end'>,
    default: 'bottom-end',
  },
})

const emit = defineEmits<{
  (event: 'confirm'): void
  (event: 'cancel'): void
}>()
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
      <div class="block p-4">
        <p class="text-sm text-slate-700">
          {{ props.message }}
        </p>
        <div class="flex items-center gap-2 mt-4">
          <PopoverButton
            as="button"
            class="w-full btn btn--gray !py-1.5 !text-sm !font-medium"
            @click="emit('cancel')"
          >
            {{ props.cancelText }}
          </PopoverButton>
          <PopoverButton
            as="button"
            class="w-full btn btn--danger !py-1.5 !text-sm !font-medium"
            @click.stop="emit('confirm')"
          >
            {{ props.confirmText }}
          </PopoverButton>
        </div>
      </div>
    </template>
  </Popover>
</template>
