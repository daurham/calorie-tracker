import type { FoodLogInput } from '../../types/food-log.js';
import type { PackagedFoodResult } from '../../types/packaged-food.js';
import { scalePackagedNutrition } from './normalize.js';

export const packagedFoodToFoodLogInput = (
  product: PackagedFoodResult,
  quantity = 1,
  sourceType: 'open_food_facts' | 'nutrition_label' = product.provider === 'nutrition_label' ? 'nutrition_label' : 'open_food_facts'
): FoodLogInput => {
  const base = product.selectedNutrition || product.nutritionPerServing;
  const nutrition = scalePackagedNutrition(base, quantity);
  if (!nutrition) {
    throw new Error('Packaged product is missing serving nutrition');
  }

  const servingDescription = product.serving?.description
    || (product.serving?.gramWeight ? `${product.serving.gramWeight}g` : '1 serving');

  return {
    display_name: product.brand ? `${product.name}` : product.name,
    source_type: sourceType,
    source_id: product.foodId ?? null,
    nutrition_source: sourceType,
    quantity,
    serving_description: quantity === 1 ? servingDescription : `${quantity} × ${servingDescription}`,
    weight_grams: product.serving?.gramWeight != null
      ? Number((product.serving.gramWeight * quantity).toFixed(2))
      : null,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    confidence: 'high',
    original_input: `barcode:${product.barcode}`,
    metadata: {
      provider: product.provider,
      barcode: product.barcode,
      externalId: product.externalId,
      brand: product.brand,
      serving: product.serving,
      foodId: product.foodId ?? null,
    },
  };
};
