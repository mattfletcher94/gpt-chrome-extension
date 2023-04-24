<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import IconKey from '../components/IconKey.vue'
import { onMounted, ref } from 'vue'
import { useAppStore } from '../stores/app'

const router = useRouter()
const appStore = useAppStore()

const key = ref(appStore.openAIAPIKey)

function goBack() {
    router.push('/')
}

function updateKey () {
    appStore.setOpenAIApiKey(key.value)
}

</script>
<template>
    <div class="w-full h-full overflow-x-hidden overflow-y-auto">
        <!-- Toolbar with back-->
        <TitleBar
            :back-button="goBack"
        >
            <template #title>
                <div class="w-full flex items-center justify-between gap-2">
                    <div>
                        Configure OpenAI
                    </div>
                    <div>
                        <IconKey class="w-4 h-4" />
                    </div>
                </div>
            </template>
        </TitleBar>

        <div class="p-4">
            <input
                v-model="key"
                type="text"
                class="w-full h-10 px-2 text-sm text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                placeholder="Enter your OpenAI API key"
            />
            <button @click="updateKey">
                Save
            </button>

        </div>
    </div>
</template>