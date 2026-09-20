import type { NutritionLabelResult } from '../../types/nutrition-label';
import type { PackagedFoodResult } from '../../types/packaged-food';

export const emptyNutritionLabel = (barcode?: string | null): NutritionLabelResult => ({
  productName: null,
  serving: { description: null, amount: 1, unit: 'serving', gramWeight: null },
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  servingsPerContainer: null,
  barcode: barcode || null,
  confidence: {
    calories: 'medium',
    protein: 'medium',
    carbs: 'medium',
    fat: 'medium',
  },
});

export const labelToPackagedFood = (
  label: NutritionLabelResult,
  barcode?: string | null
): PackagedFoodResult => {
  const nutrition = label.calories == null ? null : {
    calories: Math.round(label.calories),
    protein: label.protein,
    carbs: label.carbs,
    fat: label.fat,
  };

  return {
    provider: 'nutrition_label',
    externalId: barcode || `label:${label.productName || 'unknown'}`,
    barcode: barcode || '',
    name: label.productName || 'Packaged food',
    brand: null,
    nutritionPer100g: null,
    serving: label.serving,
    nutritionPerServing: nutrition,
    selectedNutrition: nutrition,
    metadata: {
      provider: 'nutrition_label',
      servingsPerContainer: label.servingsPerContainer,
      persistedImage: false,
    },
  };
};
