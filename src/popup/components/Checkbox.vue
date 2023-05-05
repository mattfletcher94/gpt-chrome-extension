<script setup lang="ts">
import { computed, ref } from 'vue'
import { Switch } from '@headlessui/vue'

const props = defineProps<{
  checked: boolean
  disabled?: boolean
  labelPlacement?: 'left' | 'right'
}>()

const emits = defineEmits<{
  (event: 'change', value: boolean): void
}>()

// Create a computed vmodel
const computedChecked = computed({
  get: () => props.checked,
  set: value => emits('change', value),
})
</script>

<template>
  <Switch
    v-model="computedChecked"
    :disabled="props.disabled"
    :class="{
      'bg-primary-500 border-primary-500': computedChecked,
      'bg-white border-gray-300': !computedChecked,
      'cursor-pointer': !props.disabled,
      'cursor-not-allowed opacity-70': props.disabled,
    }"
    class="form-checkbox relative inline-flex items-center justify-center h-6 w-6 shrink-0 border rounded-md transition-colors duration-200 ease-in-out ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75"
  >
    <svg
      class="w-4 h-4 text-slate-700 opacity-0 transition-opacity duration-200"
      :class="computedChecked ? '!opacity-100 !text-white' : ''"
      stroke="currentColor"
      fill="currentColor"
      stroke-width="0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="none" d="M0 0h24v24H0z" /><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  </Switch>
</template>
