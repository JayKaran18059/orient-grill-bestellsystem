import z from 'zod'
import { LocaleValueSchema, WeightUnitSchema } from './common'
import { ImageSchema } from './image'
import { VideoSchema } from './video'

export const NutritionFactsSchema = z.object({
  calories: z.number().nonnegative(),
  carbohydrate: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
})
export type NutritionFacts = z.infer<typeof NutritionFactsSchema>

export const ProductBadgeSchema = z.object({
  id: z.string(),
  title: LocaleValueSchema.array(),
})
export type ProductBadge = z.infer<typeof ProductBadgeSchema>

export const ProductVariantSchema = z.object({
  id: z.string(),
  title: LocaleValueSchema.array(),
  images: ImageSchema.array(),
  video: VideoSchema.optional(),
  weightUnit: WeightUnitSchema,
  weightValue: z.number().nonnegative(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  sku: z.string().nullable(),
  nutritionFacts: NutritionFactsSchema.nullable(),
})
export type ProductVariant = z.infer<typeof ProductVariantSchema>

export const RecommendedProductSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productVariantId: z.string(),
})
export type RecommendedProduct = z.infer<typeof RecommendedProductSchema>

export const CompositionIngredientSchema = z.object({
  title: LocaleValueSchema.array(),
})
export type CompositionIngredient = z.infer<typeof CompositionIngredientSchema>

export const CompositionProductSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productVariantId: z.string(),
})
export type CompositionProductItem = z.infer<typeof CompositionProductSchema>

export const ProductCompositionSchema = z.object({
  products: CompositionProductSchema.array().optional(),
  ingredients: CompositionIngredientSchema.array().optional(),
})
export type ProductComposition = z.infer<typeof ProductCompositionSchema>

/**
 * Eine Wahlmöglichkeit innerhalb einer Gruppe.
 *
 * `priceChange` ist der Aufpreis in der Währung des Shops. Bei
 * abwählbaren Zutaten steht dort 0 — wer die Zwiebeln weglässt,
 * zahlt schließlich nicht weniger.
 */
export const ProductOptionSchema = z.object({
  id: z.string(),
  title: LocaleValueSchema.array(),
  priceChange: z.number().default(0),
  /** Vorausgewählt — bei enthaltenen Zutaten der Normalfall */
  isDefault: z.boolean().default(false),
})
export type ProductOption = z.infer<typeof ProductOptionSchema>

/**
 * Eine Gruppe von Wahlmöglichkeiten zu einem Gericht.
 *
 * `remove` — enthaltene Zutaten, die der Gast abwählen kann.
 *   Alle Einträge sind vorausgewählt, Abwählen kostet nichts.
 * `add` — Extras, die gegen Aufpreis dazukommen.
 */
export const ProductOptionGroupSchema = z.object({
  id: z.string(),
  title: LocaleValueSchema.array(),
  type: z.enum(['remove', 'add']),
  options: ProductOptionSchema.array(),
})
export type ProductOptionGroup = z.infer<typeof ProductOptionGroupSchema>

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: LocaleValueSchema.array(),
  description: LocaleValueSchema.array().optional(),
  isAvailableForPurchase: z.boolean(),
  isShownInCatalog: z.boolean(),
  variants: ProductVariantSchema.array(),
  composition: ProductCompositionSchema.optional(),
  badges: ProductBadgeSchema.array().optional(),
  recommendedProducts: RecommendedProductSchema.array().optional(),
  /** Zutaten zum Abwählen und Extras zum Dazubestellen */
  optionGroups: ProductOptionGroupSchema.array().optional(),
})
export type Product = z.infer<typeof ProductSchema>
