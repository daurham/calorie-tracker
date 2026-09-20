import type { EstimateValidation, FallbackNutrition } from '../../types/food-interpretation';
import type { Nutrition, NutritionConfidence } from '../../types/food-log';
import { estimatedMacroCalories } from '../food-ai/validate-label';

export const generateCalorieRange = (
  calories: number,
  confidence: NutritionConfidence,
  provided?: { calorieLow?: number | null; calorieHigh?: number | null }
) => {
  if (provided?.calorieLow != null && provided?.calorieHigh != null && provided.calorieHigh >= provided.calorieLow) {
    return { calorieLow: Math.round(provided.calorieLow), calorieHigh: Math.round(provided.calorieHigh) };
  }
  const spread = confidence === 'high' ? 0.15 : confidence === 'low' ? 0.35 : 0.25;
  return {
    calorieLow: Math.max(0, Math.round(calories * (1 - spread))),
    calorieHigh: Math.round(calories * (1 + spread)),
  };
};

export const roundDisplayCalories = (calories: number) => Math.round(calories / 10) * 10;

export const formatApproxCalories = (calories: number, estimated: boolean) =>
  estimated ? `≈${roundDisplayCalories(calories)}` : String(Math.round(calories));

export const validateAiNutrition = (
  nutrition: Nutrition | FallbackNutrition,
  extras?: { weightGrams?: number | null; confidence?: NutritionConfidence }
): EstimateValidation => {
  const warnings: string[] = [];
  const calories = nutrition.calories;
  if (calories == null || !Number.isFinite(calories) || calories <= 0) {
    return { ok: false, warnings: ['Calories are missing from the estimate.'], rejected: true };
  }

  const expected = estimatedMacroCalories(nutrition.protein ?? null, nutrition.carbs ?? null, nutrition.fat ?? null);
  if (expected != null) {
    const delta = Math.abs(calories - expected);
    const ratio = delta / Math.max(calories, 1);
    if (delta > 200 && ratio > 0.6) {
      warnings.push(`Calories (${Math.round(calories)}) differ a lot from macros (~${Math.round(expected)}).`);
      return { ok: false, warnings, rejected: true };
    }
    if (delta > 80 && ratio > 0.35) {
      warnings.push(`Calories (${Math.round(calories)}) differ a lot from macros (~${Math.round(expected)}).`);
    }
  }

  if (extras?.weightGrams && extras.weightGrams > 0) {
    const density = calories / extras.weightGrams;
    if (density > 12) {
      warnings.push('Calorie density looks unusually high for the estimated weight.');
    }
    if (density < 0.08 && calories > 40) {
      warnings.push('Calorie density looks unusually low for the estimated weight.');
    }
  }

  const rejected = warnings.some(message => message.includes('missing'));
  return { ok: warnings.length === 0, warnings, rejected };
};

export const downrankConfidence = (
  confidence: NutritionConfidence,
  validation: EstimateValidation
): NutritionConfidence => {
  if (validation.rejected) return 'low';
  if (!validation.ok && confidence === 'high') return 'medium';
  if (!validation.ok) return 'low';
  return confidence;
};
