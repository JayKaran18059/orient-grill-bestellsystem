<template>
  <h1 class="pt-8 mb-4 md:mb-8 text-3xl md:text-4xl font-semibold text-center motion-preset-pop">
    {{ $dict('account.register-title') }}
  </h1>

  <div class="p-3 md:p-6 max-w-md mx-auto bg-elevated/50 rounded-xl flex flex-col gap-5 motion-preset-slide-left-sm">
    <UButton
      block
      size="xl"
      variant="outline"
      color="neutral"
      icon="i-simple-icons-google"
      :label="$dict('account.continue-with-google')"
      :loading="isGoogleLoading"
      @click="continueWithGoogle()"
    />

    <div class="flex items-center gap-3 text-sm text-dimmed">
      <div class="h-px flex-1 bg-default" />
      {{ $dict('account.divider-or') }}
      <div class="h-px flex-1 bg-default" />
    </div>

    <div class="flex flex-col gap-3">
      <UFormField :label="$dict('account.name-label')">
        <UInput
          v-model="name"
          size="xl"
          autocomplete="name"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$dict('account.email-label')" required>
        <UInput
          v-model="email"
          type="email"
          size="xl"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$dict('common.password')" required>
        <UInput
          v-model="password"
          type="password"
          size="xl"
          autocomplete="new-password"
          class="w-full"
          @keyup.enter="submit()"
        />
      </UFormField>
    </div>

    <CheckoutInfoMessage
      v-if="errorMessage"
      icon="alert"
      :message="errorMessage"
    />

    <UButton
      block
      size="xl"
      variant="solid"
      color="secondary"
      :label="$dict('account.submit-register')"
      :loading="isLoading"
      :disabled="!email || password.length < 8"
      @click="submit()"
    />

    <NuxtLink to="/login" class="text-center text-sm text-dimmed hover:text-default">
      {{ $dict('account.switch-to-login') }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'finish',
})

const { dict } = useDictionary()
const { fetch: refreshSession } = useUserSession()

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const isGoogleLoading = ref(false)

async function submit() {
  if (!email.value || password.value.length < 8) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { email: email.value, password: password.value, name: name.value || undefined },
    })

    await refreshSession()
    await navigateTo('/konto')
  } catch (error) {
    errorMessage.value = (error as { data?: { message?: string } })?.data?.message ?? dict('error.default')
  } finally {
    isLoading.value = false
  }
}

function continueWithGoogle() {
  isGoogleLoading.value = true
  window.location.href = '/api/auth/google'
}

useHead({
  title: dict('account.register-title'),
})
</script>
