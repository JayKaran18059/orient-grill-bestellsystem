<template>
  <h1 class="pt-8 mb-4 md:mb-8 text-3xl md:text-4xl font-semibold">
    {{ $dict('account.my-account-title') }}
  </h1>

  <template v-if="!userSession.loggedIn.value || !userSession.user.value?.customerId">
    <CheckoutBlock class="max-w-md">
      <p class="text-muted">
        {{ $dict('account.switch-to-login') }}
      </p>
      <div class="flex gap-3">
        <UButton
          size="lg"
          variant="solid"
          color="secondary"
          to="/login"
          :label="$dict('account.login-title')"
        />
        <UButton
          size="lg"
          variant="outline"
          color="neutral"
          to="/registrieren"
          :label="$dict('account.register-title')"
        />
      </div>
    </CheckoutBlock>
  </template>

  <template v-else>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      <div class="col-span-full md:col-span-7 space-y-6">
        <CheckoutBlock>
          <div class="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-medium">
                {{ userSession.user.value?.name || userSession.user.value?.email }}
              </p>
              <p v-if="userSession.user.value?.name" class="text-sm text-muted">
                {{ userSession.user.value?.email }}
              </p>
            </div>
            <UButton
              size="md"
              variant="outline"
              color="neutral"
              :label="$dict('common.sign-out')"
              :loading="isLoggingOut"
              @click="logout()"
            />
          </div>
        </CheckoutBlock>

        <CheckoutBlock>
          <h3 class="text-lg font-medium text-muted">
            {{ $dict('account.order-history-title') }}
          </h3>

          <p v-if="!isLoadingHistory && orders.length === 0" class="text-sm text-muted">
            {{ $dict('account.no-orders-yet') }}
          </p>

          <ul v-else class="flex flex-col divide-y divide-default">
            <li
              v-for="order in orders"
              :key="order.id"
              class="py-3 flex flex-row items-center justify-between gap-4"
            >
              <div>
                <p class="font-medium">
                  {{ new Date(order.createdAt).toLocaleDateString() }}
                </p>
                <p class="text-sm text-muted">
                  {{ order.items.length }} {{ $dict('common.abbreviation.pcs') }}
                </p>
              </div>
              <div class="font-medium tracking-tight">
                {{ optionsStore.formatCurrency(order.totalPrice) }} <span class="text-sm">{{ optionsStore.currencySign }}</span>
              </div>
            </li>
          </ul>
        </CheckoutBlock>
      </div>

      <div class="col-span-full flex flex-col gap-6 md:col-span-5">
        <CheckoutBlock>
          <template v-if="loyalty">
            <LoyaltyCard
              :stamp-count="loyalty.stampCount"
              :stamps-per-reward="loyalty.stampsPerReward"
              :reward-available="loyalty.rewardAvailable"
            />
          </template>
        </CheckoutBlock>

        <!-- Damit der Gast seinen Code auch findet, wenn die E-Mail
             im Spam gelandet ist -->
        <CheckoutBlock>
          <DiscountCodeList />
        </CheckoutBlock>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { Order } from '@nextorders/food-schema'

const { dict } = useDictionary()
const optionsStore = useOptionsStore()
const userSession = useUserSession()

const isLoggingOut = ref(false)
const isLoadingHistory = ref(true)
const orders = ref<Order[]>([])

interface LoyaltyState {
  stampCount: number
  stampsPerReward: number
  rewardAvailable: boolean
}
const loyalty = ref<LoyaltyState | null>(null)

async function loadAccountData() {
  if (!userSession.user.value?.customerId) {
    isLoadingHistory.value = false
    return
  }

  loyalty.value = await $fetch('/api/loyalty/me').catch(() => null)

  const orderIds = await $fetch('/api/order/history').catch(() => [] as string[])
  const loaded = await Promise.all(
    orderIds.map((id) => $fetch(`/api/order/id/${id}`).catch(() => null)),
  )
  orders.value = loaded.filter((order): order is Order => !!order?.id)
  isLoadingHistory.value = false
}

async function logout() {
  isLoggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await userSession.fetch()
    await navigateTo('/')
  } finally {
    isLoggingOut.value = false
  }
}

await loadAccountData()

useHead({
  title: dict('account.my-account-title'),
})
</script>
