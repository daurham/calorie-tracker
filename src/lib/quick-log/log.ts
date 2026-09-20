import type { FoodLog, FoodLogInput, FoodLogNutritionSource, FoodLogSourceType } from '../../types/food-log.js';
import type { SearchCandidate } from '../../types/food-search.js';
import type { ParsedQuantity } from './quantity.js';
import { scaleCandidateNutrition } from './scale.js';

export const SOURCE_BY_ENTITY: Record<SearchCandidate['entityType'], FoodLogSourceType> = {
  food: 'food',
  meal_combo: 'meal_combo',
  ingredient: 'ingredient',
  historical_log: 'historical_log',
};

export const NUTRITION_SOURCE_BY_ENTITY: Record<SearchCandidate['entityType'], FoodLogNutritionSource> = {
  food: 'catalog',
  meal_combo: 'catalog',
  ingredient: 'catalog',
  historical_log: 'legacy',
};

export const candidateToFoodLogInput = (
  candidate: SearchCandidate,
  options: {
    parsed?: ParsedQuantity;
    originalInput?: string;
    weightGrams?: number | null;
  } = {}
): FoodLogInput => {
  const parsed = options.parsed || {
    quantity: 1,
    unit: null,
    unitKind: 'serving' as const,
    foodQuery: candidate.name,
    raw: options.originalInput || candidate.name,
    canScaleByServing: true,
  };
  const scaled = scaleCandidateNutrition(
    { ...candidate, weightGrams: options.weightGrams ?? null },
    parsed
  );
  const sourceId = Number(candidate.id);

  return {
    display_name: candidate.name,
    source_type: SOURCE_BY_ENTITY[candidate.entityType],
    source_id: Number.isFinite(sourceId) ? sourceId : null,
    nutrition_source: NUTRITION_SOURCE_BY_ENTITY[candidate.entityType],
    quantity: scaled.quantity,
    serving_description: scaled.servingDescription,
    calories: scaled.nutrition.calories,
    protein: scaled.nutrition.protein,
    carbs: scaled.nutrition.carbs,
    fat: scaled.nutrition.fat,
    confidence: candidate.confidence,
    original_input: options.originalInput || parsed.raw,
    metadata: {
      entityType: candidate.entityType,
      usageCount: candidate.usageCount,
    },
  };
};

export const quickCaloriesToFoodLogInput = (input: {
  name: string;
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}): FoodLogInput => ({
  display_name: input.name.trim(),
  source_type: 'quick_calories',
  source_id: null,
  nutrition_source: 'user_entered',
  quantity: 1,
  calories: Math.round(input.calories),
  protein: input.protein == null || input.protein === ('' as any) ? null : Number(input.protein),
  carbs: input.carbs == null || input.carbs === ('' as any) ? null : Number(input.carbs),
  fat: input.fat == null || input.fat === ('' as any) ? null : Number(input.fat),
  original_input: input.name.trim(),
  metadata: { quickCalories: true },
});

export const foodLogToInput = (log: FoodLog): FoodLogInput => ({
  logged_at: log.logged_at,
  group_id: log.group_id,
  display_name: log.display_name,
  source_type: log.source_type,
  source_id: log.source_id,
  nutrition_source: log.nutrition_source,
  quantity: log.quantity,
  serving_description: log.serving_description,
  weight_grams: log.weight_grams,
  calories: log.calories,
  protein: log.protein,
  carbs: log.carbs,
  fat: log.fat,
  confidence: log.confidence,
  calorie_low: log.calorie_low,
  calorie_high: log.calorie_high,
  original_input: log.original_input,
  metadata: log.metadata,
});

export const createsCanonicalFood = (_input: FoodLogInput) => false;
