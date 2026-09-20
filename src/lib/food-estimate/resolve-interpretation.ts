import type { EstimateItem, FallbackNutrition, FoodComponent, FoodInterpretation } from '../../types/food-interpretation.js';
import type { Nutrition, NutritionConfidence } from '../../types/food-log.js';
import type { FoodSearchResponse } from '../../types/food-search.js';
import type { NutritionProvider } from '../../types/nutrition-provider.js';
import { applyParsedQuantityToCandidate, calculateFromPer100g, ouncesToGrams } from '../nutrition-providers/math.js';
import { classifyUsdaRanking, rankUsdaCandidates } from '../nutrition-providers/usda/rank.js';
import { parseQuantityQuery } from '../quick-log/quantity.js';
import { downrankConfidence, generateCalorieRange, validateAiNutrition } from './validate.js';

export interface InterpretationResolveDeps {
  searchLocal: (query: string) => FoodSearchResponse | Promise<FoodSearchResponse>;
  provider?: NutritionProvider | null;
}

const LOCAL_WINS = new Set(['exact', 'strong']);

const toNutrition = (calories: number, protein: number | null, carbs: number | null, fat: number | null): Nutrition => ({
  calories: Math.round(calories),
  protein,
  carbs,
  fat,
});

const itemId = (name: string, index: number) => `${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const gramsFromComponent = (component: FoodComponent) => {
  if (component.estimatedWeightGrams && component.estimatedWeightGrams > 0) {
    return component.estimatedWeightGrams;
  }
  const parsed = parseQuantityQuery([component.quantityDescription, component.name].filter(Boolean).join(' '));
  if (parsed.unitKind === 'weight') {
    return parsed.unit === 'oz' ? ouncesToGrams(parsed.quantity) : parsed.quantity;
  }
  return null;
};

export const fallbackToItem = (
  name: string,
  servingDescription: string | null,
  weightGrams: number | null,
  fallback: FallbackNutrition,
  assumptions: string[],
  confidence: NutritionConfidence,
  index: number
): EstimateItem | null => {
  if (fallback.calories == null) return null;
  const nutrition = toNutrition(fallback.calories, fallback.protein, fallback.carbs, fallback.fat);
  const validation = validateAiNutrition(nutrition, { weightGrams, confidence });
  if (validation.rejected) return null;
  const nextConfidence = downrankConfidence(confidence === 'verified' ? 'medium' : confidence, validation);
  const range = generateCalorieRange(nutrition.calories, nextConfidence, fallback);
  return {
    id: itemId(name, index),
    name,
    servingDescription,
    weightGrams,
    quantity: 1,
    nutrition,
    calorieLow: range.calorieLow,
    calorieHigh: range.calorieHigh,
    nutritionSource: 'ai_estimate',
    sourceType: 'ai_estimate',
    confidence: nextConfidence === 'verified' ? 'medium' : nextConfidence,
    assumptions,
    validation,
    canScaleByWeight: weightGrams != null && weightGrams > 0,
    baseNutrition: nutrition,
    baseWeightGrams: weightGrams,
    usedAiFallback: true,
  };
};

const fromLocal = (
  component: FoodComponent,
  local: FoodSearchResponse,
  index: number
): EstimateItem | null => {
  if (!LOCAL_WINS.has(local.classification) || local.results.length === 0) return null;
  const match = local.results[0];
  const nutrition = toNutrition(match.calories, match.protein, match.carbs, match.fat);
  const weightGrams = gramsFromComponent(component);
  return {
    id: itemId(component.name, index),
    name: match.name,
    servingDescription: component.quantityDescription || match.servingDescription,
    weightGrams,
    quantity: 1,
    nutrition,
    calorieLow: null,
    calorieHigh: null,
    nutritionSource: 'catalog',
    sourceType: match.entityType === 'historical_log' ? 'historical_log' : match.entityType === 'ingredient' ? 'ingredient' : match.entityType === 'meal_combo' ? 'meal_combo' : 'food',
    confidence: 'high',
    assumptions: [],
    validation: { ok: true, warnings: [], rejected: false },
    referenceName: match.name,
    referenceExternalId: String(match.id),
    canScaleByWeight: weightGrams != null,
    baseNutrition: nutrition,
    baseWeightGrams: weightGrams,
    usedAiFallback: false,
  };
};

const fromUsda = async (
  component: FoodComponent,
  deps: InterpretationResolveDeps,
  index: number
): Promise<EstimateItem | null> => {
  if (!deps.provider) return null;
  const results = await deps.provider.search(component.name);
  const ranked = rankUsdaCandidates(component.name, results);
  if (classifyUsdaRanking(ranked) === 'none' || ranked.length === 0) return null;
  const top = ranked[0];
  if (top.matchType === 'none') return null;
  const parsed = parseQuantityQuery([component.quantityDescription, component.name].filter(Boolean).join(' '));
  const explicitGrams = gramsFromComponent(component);
  const applied = explicitGrams
    ? {
        nutrition: calculateFromPer100g(top.candidate.nutritionPer100g, explicitGrams),
        weightGrams: Number(explicitGrams.toFixed(2)),
        servingDescription: component.quantityDescription || `${Math.round(explicitGrams)}g`,
      }
    : applyParsedQuantityToCandidate(top.candidate, parsed);
  if (!applied.nutrition) return null;
  const weightGrams = applied.weightGrams;
  const nutrition = applied.nutrition;
  const confidence: NutritionConfidence = (top.matchType === 'exact' || top.matchType === 'strong')
    ? (explicitGrams ? 'medium' : 'high')
    : 'medium';
  const range = confidence === 'high'
    ? { calorieLow: null, calorieHigh: null }
    : generateCalorieRange(nutrition.calories, confidence);
  return {
    id: itemId(component.name, index),
    name: top.candidate.name,
    servingDescription: component.quantityDescription || applied.servingDescription,
    weightGrams,
    quantity: 1,
    nutrition,
    calorieLow: range.calorieLow,
    calorieHigh: range.calorieHigh,
    nutritionSource: 'usda',
    sourceType: 'usda',
    confidence,
    assumptions: [],
    validation: { ok: true, warnings: [], rejected: false },
    referenceName: top.candidate.name,
    referenceExternalId: top.candidate.externalId,
    canScaleByWeight: Boolean(weightGrams),
    baseNutrition: nutrition,
    baseWeightGrams: weightGrams,
    usedAiFallback: false,
  };
};

const leftoverFallback = (
  fallback: FallbackNutrition,
  hits: EstimateItem[]
): FallbackNutrition => {
  const hitCalories = hits.reduce((sum, item) => sum + item.nutrition.calories, 0);
  if (fallback.calories == null || fallback.calories <= hitCalories + 5) {
    return fallback;
  }
  const leftoverCalories = Math.max(0, fallback.calories - hitCalories);
  const leftoverMacro = (value: number | null, key: 'protein' | 'carbs' | 'fat') => {
    if (value == null) return null;
    const used = hits.reduce((sum, item) => sum + (item.nutrition[key] || 0), 0);
    return Number(Math.max(0, value - used).toFixed(1));
  };
  return {
    calories: leftoverCalories,
    protein: leftoverMacro(fallback.protein, 'protein'),
    carbs: leftoverMacro(fallback.carbs, 'carbs'),
    fat: leftoverMacro(fallback.fat, 'fat'),
    calorieLow: fallback.calorieLow != null ? Math.max(0, fallback.calorieLow - hitCalories) : null,
    calorieHigh: fallback.calorieHigh != null ? Math.max(0, fallback.calorieHigh - hitCalories) : null,
  };
};

export const resolveInterpretation = async (
  interpretation: FoodInterpretation,
  deps: InterpretationResolveDeps
): Promise<EstimateItem[]> => {
  const resolved: Array<EstimateItem | null> = [];
  for (const [index, component] of interpretation.components.entries()) {
    const local = await deps.searchLocal(component.name);
    const history = fromLocal(component, local, index);
    if (history) {
      resolved.push(history);
      continue;
    }
    try {
      resolved.push(await fromUsda(component, deps, index));
    } catch {
      resolved.push(null);
    }
  }

  const hits = resolved.filter((item): item is EstimateItem => item != null);
  const misses = interpretation.components
    .map((component, index) => ({ component, index, hit: resolved[index] }))
    .filter(entry => entry.hit == null);

  if (misses.length === 0) return hits;

  const fallback = interpretation.fallbackNutrition;
  if (!fallback) return hits;

  if (hits.length === 0) {
    const whole = fallbackToItem(
      interpretation.displayName,
      interpretation.portion.description,
      interpretation.portion.estimatedWeightGrams,
      fallback,
      interpretation.assumptions,
      interpretation.confidence,
      0
    );
    return whole ? [whole] : [];
  }

  if (misses.length === 1) {
    const only = misses[0];
    const leftover = fallbackToItem(
      only.component.name,
      only.component.quantityDescription,
      gramsFromComponent(only.component),
      leftoverFallback(fallback, hits),
      interpretation.assumptions,
      interpretation.confidence,
      only.index
    );
    return leftover ? [...hits, leftover] : hits;
  }

  return hits;
};
