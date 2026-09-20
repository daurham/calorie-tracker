import type { Nutrition } from '../../types/food-log';
import type { PackagedFoodResult, PackagedServing } from '../../types/packaged-food';
import { calculateFromPer100g } from '../nutrition-providers/math';

const toNullableNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nutritionFrom = (
  calories: unknown,
  protein: unknown,
  carbs: unknown,
  fat: unknown
): Nutrition | null => {
  const kcal = toNullableNumber(calories);
  if (kcal == null) return null;
  return {
    calories: Math.round(kcal),
    protein: toNullableNumber(protein),
    carbs: toNullableNumber(carbs),
    fat: toNullableNumber(fat),
  };
};

const looksLikeVolume = (value?: string | null) =>
  Boolean(value && /\b(ml|cl|l|litre|liter|fl\.?\s*oz)\b/i.test(value));

const isGramUnit = (value?: string | null) =>
  Boolean(value && /^(g|gram|grams)$/i.test(String(value).trim()));

export const parseServingGrams = (
  servingSize?: string | null,
  servingQuantity?: unknown,
  servingQuantityUnit?: string | null
): number | null => {
  if (servingSize) {
    const match = String(servingSize).match(/(\d+(?:\.\d+)?)\s*(g|gram|grams)\b/i);
    if (match) {
      const grams = Number(match[1]);
      if (Number.isFinite(grams) && grams > 0) return grams;
    }
  }

  const unit = servingQuantityUnit || null;
  if (looksLikeVolume(servingSize) || (unit && !isGramUnit(unit))) return null;

  const explicit = toNullableNumber(servingQuantity);
  if (explicit != null && explicit > 0 && explicit < 5000) return explicit;
  return null;
};

export const parseServing = (product: any): PackagedServing | null => {
  const description = product.serving_size || product.servingSize || null;
  const gramWeight = parseServingGrams(
    description,
    product.serving_quantity ?? product.servingQuantity,
    product.serving_quantity_unit ?? product.servingQuantityUnit
  );
  if (!description && gramWeight == null) return null;

  const household = description
    ? String(description).match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/)
    : null;
  const householdUnit = household?.[2];
  const isGramUnit = householdUnit ? /^(g|gram|grams)$/i.test(householdUnit) : false;

  return {
    description,
    amount: household && !isGramUnit
      ? Number(household[1])
      : gramWeight,
    unit: household && !isGramUnit ? householdUnit : (gramWeight != null ? 'g' : null),
    gramWeight,
  };
};

export const chooseSelectedNutrition = (input: {
  nutritionPer100g: Nutrition | null;
  nutritionPerServing: Nutrition | null;
  serving: PackagedServing | null;
}): Nutrition | null => {
  if (input.nutritionPer100g && input.serving?.gramWeight) {
    return calculateFromPer100g(input.nutritionPer100g, input.serving.gramWeight);
  }
  if (input.nutritionPerServing) return input.nutritionPerServing;
  return null;
};

export const normalizeOpenFoodFactsProduct = (
  barcode: string,
  payload: any
): PackagedFoodResult | null => {
  const product = payload?.product || payload;
  if (!product || payload?.status === 0) return null;

  const name = String(product.product_name || product.product_name_en || '').trim();
  if (!name) return null;

  const nutriments = product.nutriments || {};
  const nutritionPer100g = nutritionFrom(
    nutriments['energy-kcal_100g'] ?? nutriments.energy_kcal_100g,
    nutriments.proteins_100g,
    nutriments.carbohydrates_100g,
    nutriments.fat_100g
  );
  const nutritionPerServing = nutritionFrom(
    nutriments['energy-kcal_serving'] ?? nutriments.energy_kcal_serving,
    nutriments.proteins_serving,
    nutriments.carbohydrates_serving,
    nutriments.fat_serving
  );
  const serving = parseServing(product);
  let selectedNutrition = chooseSelectedNutrition({ nutritionPer100g, nutritionPerServing, serving });
  // Per-100g is a provider basis, not an invented product serving.
  if (!selectedNutrition && nutritionPer100g) {
    selectedNutrition = nutritionPer100g;
  }
  if (!selectedNutrition && !nutritionPer100g) return null;

  return {
    provider: 'open_food_facts',
    externalId: String(product.code || product._id || barcode),
    barcode: String(barcode),
    name,
    brand: product.brands ? String(product.brands).split(',')[0].trim() : null,
    nutritionPer100g,
    serving: selectedNutrition === nutritionPer100g && !nutritionPerServing && !serving?.gramWeight
      ? { description: '100g', amount: 100, unit: 'g', gramWeight: 100 }
      : serving,
    nutritionPerServing,
    selectedNutrition,
    metadata: {
      provider: 'open_food_facts',
      servingSize: product.serving_size || null,
      nutrimentCount: Object.keys(nutriments).length,
    },
  };
};

export const scalePackagedNutrition = (nutrition: Nutrition | null, quantity: number): Nutrition | null => {
  if (!nutrition) return null;
  return {
    calories: Math.round(nutrition.calories * quantity),
    protein: nutrition.protein == null ? null : Number((nutrition.protein * quantity).toFixed(1)),
    carbs: nutrition.carbs == null ? null : Number((nutrition.carbs * quantity).toFixed(1)),
    fat: nutrition.fat == null ? null : Number((nutrition.fat * quantity).toFixed(1)),
  };
};
