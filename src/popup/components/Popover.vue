<script lang="ts" setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

</script>

<template>
  <div class="">
    <Popover v-slot="{ open }" class="relative">
      <PopoverButton
      >
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
        <PopoverPanel
          class="absolute top-0 right-0 transform translate-y-[-100%] z-10 px-4 w-60"
        >
          <div
            class="w-full overflow-hidden bg-white opacity-90 backdrop-blur-md rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
          >
            <div class="text-sm font-medium flex items-center p-4 border-b border-b-gray-200">
              Summarise
            </div> 
            <div class="text-sm font-medium flex items-center p-4 border-b border-b-gray-200">
              Find Links
            </div>
          </div>
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
</template>
