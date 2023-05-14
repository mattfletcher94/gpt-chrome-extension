<script setup lang="ts">
import { ref } from 'vue'
import { Configuration, OpenAIApi } from 'openai'
import { useAppStore } from '../stores/app'
import IconMenu from '../components/IconMenu.vue'
import IconSettings from '../components/IconSettings.vue'
import IconKey from '../components/IconKey.vue'
import IconOpen from '../components/IconOpen.vue'
import IconCheck from '../components/IconCheck.vue'

const appStore = useAppStore()

const tempKey = ref('')
const checkingKey = ref(false)
const errorMessage = ref('')

async function saveAndVerifyKey() {
  if (checkingKey.value)
    return

  checkingKey.value = true
  errorMessage.value = ''

  try {
    const openai = new OpenAIApi(new Configuration({ apiKey: tempKey.value.trim() }))
    await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: 'hello',
        },
      ],
    })

    await appStore.setOpenaiKey(tempKey.value)
  }
  catch (error: any) {
    errorMessage.value = 'Sorry, something went wrong. Please try again.'

    if (!error.response || !error.response.data)
      errorMessage.value = 'Sorry, something went wrong. Please try again.'

    else if (error.response.status === 402 && error.response.data.error.code === 'too_many_requests')
      errorMessage.value = 'Sorry, Open AI is too busy right now. Please try again later.'

    else if (error.response.status === 402 && error.response.data.error.code === 'insufficient_funds')
      errorMessage.value = 'You have either run out of credits or have not provided a valid payment method to OpenAI. Please top up your OpenAI account and try again.'

    else if (error.response.status === 401)
      errorMessage.value = 'Sorry, this API key is invalid. Please check your API key and try again.'
  }
  finally {
    checkingKey.value = false
  }
}
</script>

<template>
  <div class="relative flex flex-col w-full h-full overflow-hidden">
    <div class="absolute top-0 left-0 w-full flex items-center gap-2 h-16 px-4 border-b border-b-gray-200 bg-white/70 backdrop-blur-md rounded-b-2xl z-10">
      <div class="flex items-center gap-3 font-medium">
        <div class="shrink-0">
          <button
            v-tooltip="{ content: 'Menu' }"
            class="btn btn--light flex items-center justify-center !p-0 h-10 !w-10 rounded-full"
            @click="appStore.menuOpen = true"
          >
            <IconMenu class="w-5 h-5" />
          </button>
        </div>
        <div class="border-l border-l-gray-300 pl-4">
          <IconSettings class="w-5 h-5" />
        </div>
        <div>
          Settings
        </div>
      </div>
    </div>
    <div class="flex-shrink w-full h-full overflow-y-auto overflow-x-hidden pt-16">
      <div class="block p-4 border-b border-b-gray-200">
        <h2 class="flex items-center gap-2 font-semibold">
          <IconKey class="w-4 h-4" />
          Enter your OpenAI API Key
        </h2>
        <div class="mt-2 text-sm text-gray-700">
          You need an OpenAI API Key to use Tab GPT. Your API Key is stored locally on your browser and never sent anywhere else.
        </div>
        <div class="mt-4">
          <div class="flex flex-col gap-4">
            <Transition mode="out-in" name="fade">
              <div v-if="appStore.openaiKey" class="flex items-center gap-2">
                <div class="relative w-full">
                  <input
                    class="!pr-12"
                    type="text"
                    placeholder="E.g. sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    autocomplete="off"
                    value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    tabindex="0"
                    readonly
                  >
                  <div class="absolute top-1/2 right-4 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white">
                    <IconCheck class="w-4 h-4" />
                  </div>
                </div>
                <button
                  class="btn btn--primary whitespace-nowrap !py-2.5 ml-auto"
                  @click="appStore.setOpenaiKey('')"
                >
                  Remove API Key
                </button>
              </div>
              <div v-else class="flex items-center gap-2">
                <input
                  v-model="tempKey"
                  :disabled="checkingKey"
                  type="text"
                  placeholder="E.g. sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  autocomplete="off"
                  tabindex="0"
                >
                <button
                  class="btn btn--primary whitespace-nowrap !py-2.5 ml-auto"
                  :disabled="checkingKey || !tempKey.trim()"
                  @click="saveAndVerifyKey()"
                >
                  Save and verify
                </button>
              </div>
            </Transition>
            <div class="flex flex-col gap-4">
              <div v-if="errorMessage" class="text-red-500 text-sm">
                {{ errorMessage }}
              </div>
              <div class="flex items-center gap-4">
                <a class="flex items-center gap-2 text-blue-500 text-sm hover:underline" target="_blank" rel="noopener noreferrer" href="https://platform.openai.com/account/api-keys">
                  <IconOpen class="w-4 h-4" />
                  Get your API key from Open AI
                </a>
                <RouterLink class="ml-auto flex items-center gap-2 text-blue-500 text-sm hover:underline" to="/faqs">
                  Read FAQ's
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
        <!--
        <div class="my-4 text-center font-semibold">
          <details open="">
            <summary class="my-4 cursor-pointer hover:underline">
              API Key not working? Click Here.
            </summary>
            <ul class="list-disc pl-4 text-left space-y-4">
              <li>
                Make sure you have your billing info added in <a class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" href="https://platform.openai.com/account/billing/overview">OpenAI Billing</a> page.
                Without billing info, your API key will not work.
              </li>
              <li>
                OpenAI's ChatGPT API key is VERY cheap. You pay for what you use. <a class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" href="https://openai.com/pricing#language-models">The price</a> is
                roughly about 100,000 words per $1.
              </li>
              <li>A ChatGPT Plus Subscription is not needed.</li>
            </ul>
          </details>
        </div>
        <div class="mt-4 text-xs">
          The app will connect to OpenAI API server to check if your API Key is working properly.
        </div>
        <div class="mt-4">
          <div class="">
            <div class="mx-auto max-w-7xl">
              <details class="mx-auto max-w-4xl" open="">
                <summary><h2 class="text-xl font-bold tracking-tight inline-block hover:underline cursor-pointer">
                  FAQs about API Key
                </h2></summary>
                <dl class="mt-2 space-y-2">
                  <div class="pt-2" data-headlessui-state="">
                    <dt>
                      <button id="headlessui-disclosure-button-:r3:" class="flex w-full items-start justify-between text-left" type="button" aria-expanded="false" data-headlessui-state="">
                        <span class="text-sm font-semibold">How is the API key handled?</span>
                        <span class="ml-6 flex h-7 items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="h-6 w-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
                          </svg>
                        </span>
                      </button>
                    </dt>
                  </div>
                  <div class="pt-2" data-headlessui-state="">
                    <dt>
                      <button id="headlessui-disclosure-button-:r5:" class="flex w-full items-start justify-between text-left" type="button" aria-expanded="false" data-headlessui-state="">
                        <span class="text-sm font-semibold">Do I need to have ChatGPT Plus ($20/month) to use TypingMind.com?</span>
                        <span class="ml-6 flex h-7 items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="h-6 w-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
                          </svg>
                        </span>
                      </button>
                    </dt>
                  </div>
                  <div class="pt-2" data-headlessui-state="">
                    <dt>
                      <button id="headlessui-disclosure-button-:r7:" class="flex w-full items-start justify-between text-left" type="button" aria-expanded="false" data-headlessui-state="">
                        <span class="text-sm font-semibold">Do I need to pay for OpenAI for a ChatGPT API Key?</span>
                        <span class="ml-6 flex h-7 items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="h-6 w-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
                          </svg>
                        </span>
                      </button>
                    </dt>
                  </div>
                  <div class="pt-2" data-headlessui-state="">
                    <dt>
                      <button id="headlessui-disclosure-button-:r9:" class="flex w-full items-start justify-between text-left" type="button" aria-expanded="false" data-headlessui-state="">
                        <span class="text-sm font-semibold">License Key vs. API Key</span>
                        <span class="ml-6 flex h-7 items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="h-6 w-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6" />
                          </svg>
                        </span>
                      </button>
                    </dt>
                  </div>
                </dl>
                <div class="text-center mt-8">
                  <a href="/faqs" class="text-blue-500 hover:underline" target="_blank">See more FAQs</a>
                </div>
              </details>
            </div>
          </div>
        </div>
-->
        <!--
        <FormGroup
          title="OpenAI API Key"
          for="openai-api-key"
        >
          <input
            id="key"
            v-model="key"
            type="text"
            placeholder="Enter your OpenAI API key"
          >
        </FormGroup>
        -->
      </div>
    </div>
  </div>

  <!--
    <div class="w-full h-full overflow-x-hidden overflow-y-auto">
        <TitleBar :back-button="() => router.push('/')">
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
            <button class="btn btn--primary mt-4 w-full" @click="appStore.setOpenaiKey(key)">
                Save changes
            </button>
        </div>
    </div> -->
</template>
