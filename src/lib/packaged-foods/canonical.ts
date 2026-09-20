import type { CanonicalFoodRecord, CanonicalUpsertPlan, PackagedFoodResult } from '../../types/packaged-food.js';
import { normalizeName } from '../food-search/normalize.js';

export const packagedFoodToCanonical = (
  product: PackagedFoodResult,
  sourceType: 'open_food_facts' | 'nutrition_label'
): CanonicalFoodRecord => {
  const nutrition = product.selectedNutrition || product.nutritionPerServing || product.nutritionPer100g;
  if (!nutrition) {
    throw new Error('Packaged product is missing usable nutrition');
  }

  return {
    name: product.name,
    normalizedName: normalizeName(product.name),
    foodType: 'packaged',
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    servingAmount: product.serving?.amount ?? 1,
    servingUnit: product.serving?.description || product.serving?.unit || 'serving',
    weightGrams: product.serving?.gramWeight ?? null,
    sourceType,
    sourceExternalId: product.barcode || null,
    metadata: {
      barcode: product.barcode || null,
      provider: product.provider,
      externalId: product.externalId,
      brand: product.brand,
      serving: product.serving,
      nutritionPer100g: product.nutritionPer100g,
      nutritionPerServing: product.nutritionPerServing,
      persistedImage: false,
      ...(product.metadata || {}),
    },
  };
};

export const planCanonicalUpsert = (
  existing: { id: number; sourceExternalId: string | null } | null,
  product: PackagedFoodResult,
  sourceType: 'open_food_facts' | 'nutrition_label'
): CanonicalUpsertPlan => {
  const record = packagedFoodToCanonical(product, sourceType);
  if (existing && product.barcode && existing.sourceExternalId === product.barcode) {
    return { action: 'update', existingId: existing.id, record };
  }
  return { action: 'insert', existingId: null, record };
};
