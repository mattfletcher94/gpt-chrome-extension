<script lang="ts" setup>

const props = defineProps<{
    backButton?: () => void
}>()

</script>
<template>
    <div class="flex items-center gap-2 w-full px-4 h-16 bg-gray-50 border-b border-b-gray-200">
        <button v-if="props.backButton" class="p-2 text-gray-700 rounded-full hover:bg-gray-200" @click="props.backButton">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
            </svg>
        </button>
        <h1 class="w-full text-base font-medium text-gray-800 dark:text-gray-100">
            <slot name="title" />
        </h1>
    </div>
</template>