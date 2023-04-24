<script setup lang="ts">
import { useRouter } from 'vue-router'
import TitleBar from '../components/TitleBar.vue'
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import FormGroup from '../components/FormGroup.vue'

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
                        Settings
                    </div>
                </div>
            </template>
        </TitleBar>

        <div class="p-4">
            <FormGroup
                title="OpenAI API Key"
                for="openai-api-key"
            >
                <input
                    id="key"
                    v-model="key"
                    type="text"
                    placeholder="Enter your OpenAI API key"
                />
            </FormGroup>
            <button class="btn btn--primary mt-4 w-full" @click="updateKey">
                Save changes
            </button>

        </div>
    </div>
</template>