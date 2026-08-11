<template>
  <CatalogBreadcrumb :items="breadcrumbs" />

  <div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-0 gap-y-4 sm:gap-4">
      <div class="col-span-1 relative w-full aspect-square">
        <div class="relative w-full h-full">
          <ProductImage
            :images="selectedVariant?.images ?? []"
            :lazy="false"
            size="md"
          />

          <ProductVideo
            v-if="selectedVariant?.video"
            :video="selectedVariant.video"
          />
        </div>

        <div v-if="product.badges?.length" class="absolute left-2.5 right-6 bottom-3.5">
          <div class="flex flex-col gap-1.5">
            <ProductBadge
              v-for="badge in product.badges"
              :key="badge.id"
              :badge="badge"
            />
          </div>
        </div>
      </div>

      <div class="col-span-2">
        <h1 class="text-xl/6 md:text-2xl/7 font-semibold text-highlighted">
          {{ optionsStore.getLocaleValue(product?.title) }}
        </h1>
        <div class="mt-1 font-normal text-muted flex flex-row gap-3">
          <!-- Ohne hinterlegtes Gewicht stünde hier nur "0g" -->
          <span v-if="weightValue">{{ weightValue }}{{ weightUnit }}</span>
          <span>{{ optionsStore.getLocaleValue(selectedVariant?.title) }}</span>
        </div>

        <div v-if="!withSingleVariant" class="mt-4 mb-6">
          <USelect
            v-model="selectedVariantId"
            :items="variantItems"
            size="xl"
            icon="lucide:bookmark-check"
            class="min-w-56"
          />
        </div>

        <!-- Zutaten abwählen und Extras dazubestellen -->
        <div v-if="optionGroups.length" class="mt-6 mb-2">
          <ProductOptionGroups v-model="selectedOptionIds" :groups="optionGroups" />
        </div>

        <div class="mt-4 min-h-12 flex flex-row gap-4 md:gap-6 items-center justify-between md:justify-start">
          <div class="flex flex-col gap-0.5">
            <ProductOriginalPrice
              v-if="selectedVariant?.originalPrice"
              :price="optionsStore.formatCurrency(selectedVariant.originalPrice)"
              class="w-fit"
            />

            <div class="text-2xl/6 font-medium tracking-tight">
              {{ optionsStore.formatCurrency(preisMitExtras) }} <span class="text-xl">{{ optionsStore.currencySign }}</span>
            </div>
            <div v-if="aufpreis > 0" class="text-sm text-dimmed">
              inkl. {{ optionsStore.formatCurrency(aufpreis) }} {{ optionsStore.currencySign }} für Extras
            </div>
            <div v-if="gleicheZeile" class="text-sm text-dimmed">
              schon {{ gleicheZeile.quantity }}× genau so im Warenkorb
            </div>
          </div>

          <template v-if="orderStore.isLoading">
            <UIcon name="i-lucide-loader-circle" class="size-10 text-dimmed/25 motion-preset-spin" />
          </template>
          <!--
            Der Knopf bleibt immer stehen, auch wenn das Gericht schon im
            Korb liegt: nur so lässt sich ein zweiter Döner mit anderen
            Soßen bestellen. Die Menge wird im Warenkorb geändert.
          -->
          <UButton
            v-else-if="selectedVariantId"
            size="xl"
            variant="solid"
            color="secondary"
            icon="lucide:shopping-basket"
            :label="$dict('web-app.cart.add-to-cart')"
            :ui="{
              leadingIcon: 'hidden md:block',
            }"
            class="md:px-6 font-medium"
            @click="orderStore.add(selectedVariantId, selectedOptionIds)"
          />
        </div>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 md:grid-cols-5 gap-y-8 md:gap-6">
      <div v-if="product?.composition" class="col-span-full">
        <ProductCompositionBlock :composition="product.composition" />
      </div>

      <div v-if="product?.description" class="col-span-3">
        <h2 class="mb-1 font-medium text-muted">
          {{ $dict('common.description') }}
        </h2>
        <div class="text-base/5">
          {{ optionsStore.getLocaleValue(product?.description) }}
        </div>
      </div>

      <div v-if="selectedVariant?.nutritionFacts" class="col-span-2">
        <h2 class="mb-1 font-medium text-muted">
          {{ $dict('common.nutrition.value-title') }}
        </h2>
        <div class="py-3.5 px-4.5 w-fit flex flex-row gap-4 lg:gap-5 bg-elevated/50 rounded-lg">
          <div>
            <div class="font-medium">
              {{ selectedVariant.nutritionFacts.calories }}
            </div>
            <div class="mt-1 text-base/4 lowercase text-muted">
              {{ $dict('common.nutrition.kcal') }}
            </div>
          </div>
          <div>
            <div class="flex flex-row gap-0.5 font-medium">
              {{ selectedVariant.nutritionFacts.protein }}
              <span>{{ $dict('common.abbreviation.g') }}</span>
            </div>
            <div class="mt-1 text-base/4 lowercase text-muted">
              {{ $dict('common.nutrition.protein') }}
            </div>
          </div>
          <div>
            <div class="flex flex-row gap-0.5 font-medium">
              {{ selectedVariant.nutritionFacts.fat }}
              <span>{{ $dict('common.abbreviation.g') }}</span>
            </div>
            <div class="mt-1 text-base/4 lowercase text-muted">
              {{ $dict('common.nutrition.fat') }}
            </div>
          </div>
          <div>
            <div class="flex flex-row gap-0.5 font-medium">
              {{ selectedVariant.nutritionFacts.carbohydrate }}
              <span>{{ $dict('common.abbreviation.g') }}</span>
            </div>
            <div class="mt-1 text-base/4 lowercase text-muted">
              {{ $dict('common.nutrition.carbohydrate') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="product.recommendedProducts?.length" class="mt-12">
      <h2 class="mb-2 font-medium text-muted">
        {{ $dict('web-app.most-often-added') }}
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 gap-4 md:gap-6">
        <ProductRecommendedCard
          v-for="p in product.recommendedProducts"
          :key="p.productVariantId"
          :product="p"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { dict } = useDictionary()
const { params } = useRoute()

const orderStore = useOrderStore()
const channelStore = useChannelStore()
const optionsStore = useOptionsStore()
const menuStore = useMenuStore()

const product = menuStore.getProductBySlug(String(params.productSlug))
if (!product) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Product not found',
  })
}

useHead({
  title: `${optionsStore.getLocaleValue(product.title)} | ${optionsStore.getLocaleValue(channelStore.title)}`,
})

const variantItems = computed(() => product.variants.map((variant) => ({ label: optionsStore.getLocaleValue(variant.title), value: variant.id })))

const withSingleVariant = computed<boolean>(() => product.variants.length === 1)

const selectedVariantId = ref(product.variants[0]?.id)
const selectedVariant = computed(() => product.variants.find(({ id }) => id === selectedVariantId.value))

const weightValue = computed(() => selectedVariant.value?.weightValue)
const weightUnit = computed(() => getWeightLocalizedUnit(selectedVariant.value?.weightUnit))

// Zutaten zum Abwählen und Extras zum Dazubestellen
const optionGroups = computed(() => product.optionGroups ?? [])
const selectedOptionIds = ref<string[]>([])

/**
 * Die Warenkorbzeile, die exakt so belegt ist wie gerade eingestellt.
 * Nur dafür darf "schon im Warenkorb" stehen — derselbe Döner mit
 * anderen Soßen ist eine eigene Position.
 */
const gleicheZeile = computed(() => orderStore.items.find((zeile) => zeile.variantId === selectedVariant.value?.id && hatGenauDieseOptionen(zeile, selectedOptionIds.value)))

/** Aufpreis der gewählten Extras — abgewählte Zutaten kosten nichts */
const aufpreis = computed(() => {
  let summe = 0
  for (const group of optionGroups.value) {
    if (group.type !== 'add') {
      continue
    }
    for (const option of group.options) {
      if (selectedOptionIds.value.includes(option.id)) {
        summe += option.priceChange
      }
    }
  }
  return summe
})

const preisMitExtras = computed(() => (selectedVariant.value?.price ?? 0) + aufpreis.value)

const category = menuStore.getCategoryByProductId(product.id)

const breadcrumbs = computed(() => [
  { label: dict('common.home'), icon: 'lucide:house', to: '/' },
  {
    label: optionsStore.getLocaleValue(category?.title),
    to: `/${category?.slug}`,
  },
])
</script>
