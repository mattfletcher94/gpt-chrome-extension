<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAppStore } from './stores/app'
import MainMenu from './components/MainMenu.vue'

const store = useAppStore()
const appReady = ref(false)

onMounted(() => {
  store.init().then(() => {
    appReady.value = true
  })
})
</script>

<template>
  <div class="w-[420px] h-[540px] overflow-hidden !text-base">
    <RouterView v-if="appReady" v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
    <MainMenu
      :open="store.menuOpen"
      @close="store.menuOpen = false"
    />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
