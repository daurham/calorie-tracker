import type { EstimateDraft, EstimateItem } from '../../types/food-interpretation';
import type { CreateFoodLogsRequest, FoodLogInput } from '../../types/food-log';
import { FOOD_ESTIMATE_RESOLVER_VERSION, FOOD_INTERPRETATION_PROMPT_VERSION, FOOD_INTERPRETATION_SCHEMA_VERSION } from './constants';

export const estimateItemToFoodLogInput = (
  item: EstimateItem,
  draft: EstimateDraft
): FoodLogInput => ({
  display_name: item.name,
  source_type: item.sourceType,
  source_id: item.referenceExternalId && Number.isFinite(Number(item.referenceExternalId))
    ? Number(item.referenceExternalId)
    : null,
  nutrition_source: item.nutritionSource,
  quantity: item.quantity,
  serving_description: item.servingDescription,
  weight_grams: item.weightGrams,
  calories: item.nutrition.calories,
  protein: item.nutrition.protein,
  carbs: item.nutrition.carbs,
  fat: item.nutrition.fat,
  confidence: item.confidence,
  calorie_low: item.calorieLow,
  calorie_high: item.calorieHigh,
  original_input: draft.originalInput,
  metadata: {
    provider: item.usedAiFallback ? 'gemini' : item.nutritionSource === 'usda' ? 'usda' : 'local',
    model: item.usedAiFallback ? 'gemini' : undefined,
    promptVersion: FOOD_INTERPRETATION_PROMPT_VERSION,
    resolverVersion: FOOD_ESTIMATE_RESOLVER_VERSION,
    schemaVersion: FOOD_INTERPRETATION_SCHEMA_VERSION,
    assumptions: item.assumptions.length ? item.assumptions : draft.assumptions,
    validation: item.validation,
    estimatedRange: item.calorieLow != null && item.calorieHigh != null
      ? { low: item.calorieLow, high: item.calorieHigh }
      : null,
    interpretation: draft.interpretation,
    referenceName: item.referenceName,
    referenceExternalId: item.referenceExternalId,
    usedAiFallback: item.usedAiFallback,
    persistedImage: false,
  },
});

export const draftToFoodLogInputs = (draft: EstimateDraft): FoodLogInput[] =>
  draft.items.map(item => estimateItemToFoodLogInput(item, draft));

export const draftToCreateRequest = (draft: EstimateDraft): CreateFoodLogsRequest => {
  const logs = draftToFoodLogInputs(draft);
  if (logs.length <= 1) return { logs };
  return {
    group: {
      display_name: draft.displayName,
      original_input: draft.originalInput,
    },
    logs,
  };
};

export const createsCanonicalFoodFromEstimate = () => false;
