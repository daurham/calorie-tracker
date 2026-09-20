import type { EstimateItem } from '../../types/food-interpretation';
import { scaleNutrition } from '../quick-log/scale';
import { generateCalorieRange } from './validate';

export const scaleEstimateItem = (
  item: EstimateItem,
  next: { quantity?: number; weightGrams?: number | null }
): EstimateItem => {
  const quantity = next.quantity ?? item.quantity;
  let nutrition = scaleNutrition(item.baseNutrition, quantity);
  let weightGrams = item.baseWeightGrams != null ? item.baseWeightGrams * quantity : item.weightGrams;
  let calorieLow = item.calorieLow != null ? Math.round(item.calorieLow * quantity) : null;
  let calorieHigh = item.calorieHigh != null ? Math.round(item.calorieHigh * quantity) : null;

  if (next.weightGrams != null && item.canScaleByWeight && item.baseWeightGrams) {
    const factor = next.weightGrams / item.baseWeightGrams;
    nutrition = scaleNutrition(item.baseNutrition, factor);
    weightGrams = next.weightGrams;
    calorieLow = item.calorieLow != null ? Math.round(item.calorieLow * factor) : null;
    calorieHigh = item.calorieHigh != null ? Math.round(item.calorieHigh * factor) : null;
    const range = calorieLow == null || calorieHigh == null
      ? generateCalorieRange(nutrition.calories, item.confidence)
      : { calorieLow, calorieHigh };
    return {
      ...item,
      quantity: 1,
      weightGrams,
      nutrition,
      calorieLow: range.calorieLow,
      calorieHigh: range.calorieHigh,
      servingDescription: `${Math.round(next.weightGrams)}g`,
    };
  }

  return {
    ...item,
    quantity,
    weightGrams,
    nutrition,
    calorieLow,
    calorieHigh,
    servingDescription: quantity === 1
      ? item.servingDescription
      : `${quantity} × ${item.servingDescription || item.name}`,
  };
};

export const draftTotals = (items: EstimateItem[]) => ({
  calories: items.reduce((sum, item) => sum + item.nutrition.calories, 0),
  protein: items.some(item => item.nutrition.protein != null)
    ? Number(items.reduce((sum, item) => sum + (item.nutrition.protein || 0), 0).toFixed(1))
    : null,
  carbs: items.some(item => item.nutrition.carbs != null)
    ? Number(items.reduce((sum, item) => sum + (item.nutrition.carbs || 0), 0).toFixed(1))
    : null,
  fat: items.some(item => item.nutrition.fat != null)
    ? Number(items.reduce((sum, item) => sum + (item.nutrition.fat || 0), 0).toFixed(1))
    : null,
  calorieLow: items.some(item => item.calorieLow != null)
    ? items.reduce((sum, item) => sum + (item.calorieLow || item.nutrition.calories), 0)
    : null,
  calorieHigh: items.some(item => item.calorieHigh != null)
    ? items.reduce((sum, item) => sum + (item.calorieHigh || item.nutrition.calories), 0)
    : null,
  estimated: items.some(item => item.usedAiFallback || item.nutritionSource === 'ai_estimate'),
});
