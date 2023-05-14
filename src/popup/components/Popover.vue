<script setup lang="ts">
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/vue'
import type { PropType } from 'vue'
import { usePopper } from '../composables/usePopper'

const props = defineProps({
  width: {
    type: String,
    default: '300px',
  },
  anchor: {
    type: String as PropType<'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end'>,
    default: 'bottom',
  },
  triggerClass: {
    type: String,
    default: '',
  },
})

const [trigger, container] = usePopper({
  placement: props.anchor,
  strategy: 'fixed',
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [6, 6],
      },
    },
    {
      name: 'preventOverflow',
      options: {
        padding: 6,
      },
    },
    {
      name: 'flip',
      options: {
        padding: 6,
      },
    },
  ],
})

function resolveTransformOrigin(anchor: typeof props.anchor) {
  if (anchor === 'bottom')
    return '50% 0%'
  if (anchor === 'bottom-start')
    return '0% 0%'
  if (anchor === 'bottom-end')
    return '100% 0%'
  if (anchor === 'top')
    return '50% 100%'
  if (anchor === 'top-start')
    return '0% 100%'
  if (anchor === 'top-end')
    return '100% 100%'
  return '50% 0%'
}
</script>

<template>
  <Popover class="relative inline" as="div">
    <PopoverButton ref="trigger" as="button" :class="props.triggerClass">
      <slot name="trigger" />
    </PopoverButton>
    <Teleport to="body">
      <PopoverPanel>
        <div
          ref="container"
          class="fixed w-screen  focus:outline-none z-[99999]"
          :style="{
            'max-width': props.width,
          }"
        >
          <Transition appear mode="out-in" name="popover">
            <div
              class="bg-white bg-opacity-90 backdrop-filter backdrop-blur rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
              :style="{
                'transform-origin': resolveTransformOrigin(props.anchor),
              }"
            >
              <slot name="content" />
            </div>
          </transition>
        </div>
      </PopoverPanel>
    </Teleport>
  </Popover>
</template>

<style scoped>
.popover-enter-active,
.popover-leave-active {
  transition: opacity 200ms, transform 200ms ease;
}
.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: scale(0.75);
}
</style>
