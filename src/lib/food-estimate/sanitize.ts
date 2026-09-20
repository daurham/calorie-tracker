import type { FallbackNutrition, FoodComponent, FoodInterpretation } from '../../types/food-interpretation';

const toNullableNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeComponent = (raw: any): FoodComponent | null => {
  const name = String(raw?.name || '').trim();
  if (!name) return null;
  return {
    name,
    quantityDescription: raw?.quantityDescription ? String(raw.quantityDescription) : null,
    estimatedWeightGrams: toNullableNumber(raw?.estimatedWeightGrams),
    attributes: raw?.attributes && typeof raw.attributes === 'object' ? raw.attributes : undefined,
  };
};

const sanitizeFallback = (raw: any): FallbackNutrition | null => {
  if (!raw || typeof raw !== 'object') return null;
  const calories = toNullableNumber(raw.calories);
  if (calories == null) return null;
  return {
    calories,
    protein: toNullableNumber(raw.protein),
    carbs: toNullableNumber(raw.carbs),
    fat: toNullableNumber(raw.fat),
    calorieLow: toNullableNumber(raw.calorieLow ?? raw.calorie_low),
    calorieHigh: toNullableNumber(raw.calorieHigh ?? raw.calorie_high),
  };
};

export const sanitizeFoodInterpretation = (raw: any): FoodInterpretation => {
  const components = Array.isArray(raw?.components)
    ? raw.components.map(sanitizeComponent).filter((item): item is FoodComponent => item != null)
    : [];
  const displayName = String(raw?.displayName || components[0]?.name || 'Estimated food').trim();
  const confidence = raw?.confidence === 'high' || raw?.confidence === 'low' ? raw.confidence : 'medium';
  return {
    displayName,
    portion: {
      description: raw?.portion?.description ? String(raw.portion.description) : null,
      estimatedWeightGrams: toNullableNumber(raw?.portion?.estimatedWeightGrams),
    },
    components: components.length > 0
      ? components
      : [{ name: displayName, quantityDescription: raw?.portion?.description || null, estimatedWeightGrams: toNullableNumber(raw?.portion?.estimatedWeightGrams) }],
    assumptions: Array.isArray(raw?.assumptions)
      ? raw.assumptions.map((item: unknown) => String(item)).filter(Boolean)
      : [],
    confidence,
    fallbackNutrition: sanitizeFallback(raw?.fallbackNutrition),
  };
};

export const isLowQualityInterpretation = (interpretation: FoodInterpretation) =>
  interpretation.confidence === 'low' && interpretation.components.every(item => !item.name.trim());
