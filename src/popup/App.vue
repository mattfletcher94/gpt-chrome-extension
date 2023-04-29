<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAppStore } from './stores/app';

const store = useAppStore();
const appReady = ref(false);

onMounted(() => {
  store.init().then(() => {
    appReady.value = true;
  });
})

</script>

<template>
  <div class="w-[420px] h-[540px] overflow-hidden">
    <!-- Router view with transitions -->
    <router-view v-if="appReady" v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
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
