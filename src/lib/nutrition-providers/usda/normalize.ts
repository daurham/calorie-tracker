import type { NullableNutrition, NutritionCandidate, PortionReference } from '../../../types/nutrition-provider.js';

const ENERGY_IDS = new Set([1008, 2047, 2048]);
const PROTEIN_IDS = new Set([1003]);
const CARB_IDS = new Set([1005]);
const FAT_IDS = new Set([1004]);

const nutrientValue = (
  nutrients: Array<{ nutrientId?: number; nutrientNumber?: string; nutrientName?: string; unitName?: string; value?: number | null }> | undefined,
  ids: Set<number>,
  names: string[]
): number | null => {
  if (!nutrients) return null;
  const match = nutrients.find(item => {
    if (item.value == null) return false;
    if (item.nutrientId != null && ids.has(Number(item.nutrientId))) return true;
    if (item.nutrientNumber != null && ids.has(Number(item.nutrientNumber))) return true;
    const name = (item.nutrientName || '').toLowerCase();
    return names.some(option => name === option || name.startsWith(option));
  });
  if (!match || match.value == null) return null;
  const value = Number(match.value);
  return Number.isFinite(value) ? value : null;
};

export const extractNutrients = (nutrients?: Array<any>): NullableNutrition => {
  const calories = nutrientValue(nutrients, ENERGY_IDS, ['energy', 'calories']);
  return {
    calories: calories == null ? null : Number(calories),
    protein: nutrientValue(nutrients, PROTEIN_IDS, ['protein']),
    carbs: nutrientValue(nutrients, CARB_IDS, ['carbohydrate']),
    fat: nutrientValue(nutrients, FAT_IDS, ['total lipid', 'total fat', 'fat']),
  };
};

const toPer100g = (
  nutrition: NullableNutrition,
  grams: number | null
): NullableNutrition => {
  if (!grams || grams <= 0 || grams === 100) return nutrition;
  const ratio = 100 / grams;
  return {
    calories: nutrition.calories == null ? null : Number((nutrition.calories * ratio).toFixed(2)),
    protein: nutrition.protein == null ? null : Number((nutrition.protein * ratio).toFixed(2)),
    carbs: nutrition.carbs == null ? null : Number((nutrition.carbs * ratio).toFixed(2)),
    fat: nutrition.fat == null ? null : Number((nutrition.fat * ratio).toFixed(2)),
  };
};

export const normalizePortions = (food: any): PortionReference[] => {
  const portions: PortionReference[] = [];

  for (const measure of food.foodMeasures || food.foodPortions || []) {
    const gramWeight = measure.gramWeight == null ? null : Number(measure.gramWeight);
    const description = measure.disseminationText
      || measure.modifier
      || measure.portionDescription
      || [measure.amount, measure.measureUnit?.name || measure.measureUnitName].filter(Boolean).join(' ')
      || 'serving';
    portions.push({
      description: String(description),
      amount: measure.amount == null ? null : Number(measure.amount),
      unit: measure.measureUnit?.name || measure.measureUnitName || null,
      gramWeight: Number.isFinite(gramWeight) && gramWeight > 0 ? gramWeight : null,
    });
  }

  if (food.servingSize && String(food.servingSizeUnit || '').toLowerCase() === 'g') {
    portions.push({
      description: food.householdServingFullText || `${food.servingSize} g`,
      amount: Number(food.servingSize),
      unit: 'g',
      gramWeight: Number(food.servingSize),
    });
  }

  return portions.filter((portion, index, all) => (
    all.findIndex(item => item.description === portion.description && item.gramWeight === portion.gramWeight) === index
  ));
};

export const normalizeUsdaFood = (food: any): NutritionCandidate | null => {
  if (!food || food.fdcId == null || !food.description) return null;

  const rawNutrition = extractNutrients(food.foodNutrients);
  const brandedServingGrams = food.dataType === 'Branded'
    && food.servingSize
    && String(food.servingSizeUnit || '').toLowerCase() === 'g'
    ? Number(food.servingSize)
    : null;
  const nutritionPer100g = brandedServingGrams
    ? toPer100g(rawNutrition, brandedServingGrams)
    : rawNutrition;

  return {
    provider: 'usda',
    externalId: String(food.fdcId),
    name: String(food.description),
    nutritionPer100g,
    portions: normalizePortions(food),
    metadata: {
      dataType: food.dataType || undefined,
      brandOwner: food.brandOwner || undefined,
      description: food.description,
    },
  };
};

export const normalizeUsdaSearchResults = (payload: any): NutritionCandidate[] => {
  const foods = Array.isArray(payload?.foods) ? payload.foods : Array.isArray(payload) ? payload : [];
  return foods.map(normalizeUsdaFood).filter((item): item is NutritionCandidate => item != null);
};
