import type { Nutrition } from '../../types/food-log.js';
import { ouncesToGrams } from '../nutrition-providers/math.js';
import type { ParsedQuantity } from './quantity.js';

export const scaleNutrition = (nutrition: Nutrition, factor: number): Nutrition => ({
  calories: Math.round(Number(nutrition.calories || 0) * factor),
  protein: nutrition.protein == null ? null : Number((Number(nutrition.protein) * factor).toFixed(1)),
  carbs: nutrition.carbs == null ? null : Number((Number(nutrition.carbs) * factor).toFixed(1)),
  fat: nutrition.fat == null ? null : Number((Number(nutrition.fat) * factor).toFixed(1)),
});

export interface ScalableCandidate extends Nutrition {
  weightGrams?: number | null;
  servingDescription?: string | null;
}

export interface ScaledCandidateNutrition {
  nutrition: Nutrition;
  quantity: number;
  servingDescription: string | null;
  scaled: boolean;
}

export const scaleCandidateNutrition = (
  candidate: ScalableCandidate,
  parsed: ParsedQuantity
): ScaledCandidateNutrition => {
  if (parsed.canScaleByServing && parsed.unitKind === 'serving') {
    return {
      nutrition: scaleNutrition(candidate, parsed.quantity),
      quantity: parsed.quantity,
      servingDescription: parsed.quantity === 1
        ? candidate.servingDescription ?? null
        : `${parsed.quantity} servings`,
      scaled: parsed.quantity !== 1,
    };
  }

  if (parsed.unitKind === 'weight' && candidate.weightGrams) {
    const grams = parsed.unit === 'oz' ? ouncesToGrams(parsed.quantity) : parsed.quantity;
    const factor = grams / candidate.weightGrams;
    return {
      nutrition: scaleNutrition(candidate, factor),
      quantity: parsed.quantity,
      servingDescription: `${parsed.quantity}${parsed.unit || 'g'}`,
      scaled: true,
    };
  }

  return {
    nutrition: {
      calories: candidate.calories,
      protein: candidate.protein,
      carbs: candidate.carbs,
      fat: candidate.fat,
    },
    quantity: 1,
    servingDescription: parsed.raw || candidate.servingDescription || null,
    scaled: false,
  };
};
