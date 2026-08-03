<template>
  <div class="mb-4 flex flex-row gap-2 items-center justify-between motion-preset-slide-up-sm">
    <UTooltip :text="$dict('common.open-page')">
      <NuxtLink :to="productUrl">
        <div class="max-w-56 flex flex-row gap-2 flex-nowrap items-center cursor-pointer active:scale-98 lg:active:scale-95 lg:hover:scale-98 duration-200 group">
          <div class="relative size-14 aspect-square">
            <ProductImage :images="productVariant?.images ?? []" size="xs" />
          </div>

          <div class="flex flex-col gap-1">
            <p class="font-medium text-xs/3 line-clamp-2">
              {{ optionsStore.getLocaleValue(product?.title) }}
            </p>
            <div class="flex flex-row gap-2 flex-nowrap">
              <div class="shrink-0 text-sm/4 font-medium tracking-tight">
                {{ optionsStore.formatCurrency(line.unitPrice) }} <span class="text-xs">{{ optionsStore.currencySign }}</span>
              </div>
              <!-- Ohne hinterlegtes Gewicht stünde hier nur "0g" -->
              <div v-if="productVariant?.weightValue" class="text-sm/4 text-muted font-light">
                {{ productVariant.weightValue }}{{ getWeightLocalizedUnit(productVariant.weightUnit) }}
              </div>
            </div>

            <!-- Abgewählte Zutaten und bestellte Extras -->
            <div v-if="line.selectedOptions?.length" class="flex flex-col gap-0.5">
              <span
                v-for="option in line.selectedOptions"
                :key="option.optionId"
                class="text-[0.7rem]/3"
                :class="option.type === 'remove' ? 'text-dimmed' : 'text-secondary'"
              >
                {{ option.type === 'remove' ? 'ohne' : '+' }} {{ option.title }}
              </span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </UTooltip>

    <CartLineCounter :line="line" />
  </div>
</template>

<script setup lang="ts">
import type { OrderItem } from '@nextorders/food-schema'

const { line } = defineProps<{
  line: OrderItem
}>()

const optionsStore = useOptionsStore()
const menuStore = useMenuStore()

const product = computed(() => menuStore.getProduct(line.productId))
const productVariant = computed(() => menuStore.getProductVariant(line.variantId))
const productUrl = computed(() => menuStore.getProductUrl(line.productId))
</script>
