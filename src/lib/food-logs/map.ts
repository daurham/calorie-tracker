import { generateUniqueId, type LoggedMeal } from '../utils';
import type {
  FoodLog,
  FoodLogInput,
  FoodLogMetadata,
  FoodLogNutritionSource,
  FoodLogSourceType,
} from '../../types/food-log';
import { formatLoggedAtTime, parseLegacyTimestamp } from './day-range';

const toNumberOrNull = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toInteger = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
};

export const inferLogProvenance = (
  meal: LoggedMeal,
  options?: { migrated?: boolean }
): {
  source_type: FoodLogSourceType;
  source_id: number | null;
  nutrition_source: FoodLogNutritionSource;
} => {
  const sourceId = Number.isFinite(Number(meal.id)) ? Number(meal.id) : null;
  const modId = meal.modId || (meal.modData as { modId?: string } | undefined)?.modId;
  const isMod = Boolean(meal.modData || meal.modId || meal.meal_type === 'mod');
  const isAiMod = String(modId || '').startsWith('ai-');

  if (options?.migrated) {
    return {
      source_type: isMod ? (isAiMod ? 'ai_estimate' : 'mod') : meal.meal_type === 'composed' || meal.meal_type === 'standalone' ? 'meal_combo' : 'legacy',
      source_id: sourceId,
      nutrition_source: 'legacy',
    };
  }

  if (isMod) {
    return {
      source_type: isAiMod ? 'ai_estimate' : 'mod',
      source_id: sourceId,
      nutrition_source: isAiMod ? 'ai_estimate' : 'user_entered',
    };
  }

  if (meal.meal_type === 'composed' || meal.meal_type === 'standalone') {
    return {
      source_type: 'meal_combo',
      source_id: sourceId,
      nutrition_source: 'catalog',
    };
  }

  return {
    source_type: 'legacy',
    source_id: sourceId,
    nutrition_source: 'legacy',
  };
};

export const applyPortionToMeal = (meal: LoggedMeal): LoggedMeal => {
  const portion = meal.portion || 1;
  return {
    ...meal,
    calories: Math.round(Number(meal.calories) * portion),
    protein: meal.protein == null ? null : Number((Number(meal.protein) * portion).toFixed(1)),
    carbs: meal.carbs == null ? null : Number((Number(meal.carbs) * portion).toFixed(1)),
    fat: meal.fat == null ? null : Number((Number(meal.fat) * portion).toFixed(1)),
    portion,
    id: meal.id,
    uniqueMealId: meal.uniqueMealId || generateUniqueId(),
    timestamp: meal.timestamp || new Date().toLocaleTimeString(),
  } as LoggedMeal;
};

const buildMetadata = (meal: LoggedMeal): FoodLogMetadata => ({
  portion: meal.portion || 1,
  isEdited: Boolean(meal.isEdited),
  mealType: meal.meal_type,
  uniqueMealId: meal.uniqueMealId,
  sourceMealId: meal.id,
  ingredients: meal.ingredients || [],
  notes: meal.notes,
  instructions: meal.instructions,
  modData: meal.modData,
  modId: meal.modId,
  weight: meal.weight,
});

export const loggedMealToFoodLogInput = (
  meal: LoggedMeal,
  options?: { migrated?: boolean }
): FoodLogInput => {
  const provenance = inferLogProvenance(meal, options);

  return {
    logged_at: parseLegacyTimestamp(meal.timestamp),
    group_id: meal.foodLogGroupId ?? null,
    display_name: meal.name,
    ...provenance,
    quantity: meal.portion || 1,
    serving_description: null,
    weight_grams: meal.weight ?? null,
    calories: toInteger(meal.calories),
    protein: toNumberOrNull(meal.protein),
    carbs: toNumberOrNull(meal.carbs),
    fat: toNumberOrNull(meal.fat),
    confidence: null,
    calorie_low: null,
    calorie_high: null,
    original_input: meal.name,
    metadata: buildMetadata(meal),
  };
};

export const foodLogToLoggedMeal = (log: FoodLog): LoggedMeal => {
  const metadata = log.metadata || {};
  return {
    id: metadata.sourceMealId ?? log.source_id ?? log.id,
    name: log.display_name,
    meal_type: (metadata.mealType as LoggedMeal['meal_type']) || 'standalone',
    calories: toInteger(log.calories),
    protein: toNumberOrNull(log.protein),
    carbs: toNumberOrNull(log.carbs),
    fat: toNumberOrNull(log.fat),
    notes: metadata.notes,
    instructions: metadata.instructions,
    ingredients: (metadata.ingredients as LoggedMeal['ingredients']) || [],
    uniqueMealId: log.id,
    foodLogId: log.id,
    foodLogGroupId: log.group_id,
    timestamp: formatLoggedAtTime(log.logged_at),
    isEdited: Boolean(metadata.isEdited),
    portion: metadata.portion ?? Number(log.quantity) ?? 1,
    modData: metadata.modData,
    modId: metadata.modId,
    weight: log.weight_grams ?? metadata.weight,
    servingDescription: log.serving_description,
    sourceType: log.source_type,
    nutritionSource: log.nutrition_source,
    originalInput: log.original_input,
  } as LoggedMeal;
};

export const applyFoodLogUpdate = (
  meal: LoggedMeal,
  updates: Partial<LoggedMeal>
): LoggedMeal => ({
  ...meal,
  ...updates,
  foodLogId: meal.foodLogId,
  uniqueMealId: meal.uniqueMealId,
});
