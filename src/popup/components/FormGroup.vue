<script lang="ts" setup>
import type { PropType } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  for: {
    type: String,
    default: '',
  },
  state: {
    type: String as PropType<'' | 'error' | 'success'>,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="form-group input-text-wrap relative block w-full"
    :class="{
      'form-group--required': required,
    }"
  >
    <label v-if="props.title || $slots.title" class="relative block w-full font-medium text-base" :for="props.for">
      <span v-if="props.title" class="relative block w-full font-semibold">
        {{ props.title }}
      </span>
      <span v-else-if="$slots.title" class="relative block w-full font-semibold">
        <slot name="title" />
      </span>
    </label>
    <div
      v-if="props.description || $slots.description"
      class="relative block w-full font-normal mt-2 leading-tight"
      :class="{
        'text-gray-700': props.state === '',
        'text-red-500': props.state === 'error',
        'text-green-500': props.state === 'success',
      }"
    >
      <template v-if="props.description">
        {{ props.description }}
      </template>
      <template v-else-if="$slots.description">
        <slot name="description" />
      </template>
    </div>
    <div class="relative block w-full mt-2">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.form-group--required label span:nth-child(1)::after {
  content: '*';
  @apply text-red-500 ml-1;
}
</style>
