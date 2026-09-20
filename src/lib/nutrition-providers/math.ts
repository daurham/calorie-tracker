import type { Nutrition } from '../../types/food-log.js';
import type { NullableNutrition, NutritionCandidate, PortionReference } from '../../types/nutrition-provider.js';
import type { ParsedQuantity } from '../quick-log/quantity.js';

export const GRAMS_PER_OUNCE = 28.349523125;

export const ouncesToGrams = (ounces: number) => ounces * GRAMS_PER_OUNCE;

export const scaleNutrition = (nutrition: Nutrition, ratio: number): Nutrition => ({
  calories: Math.round(Number(nutrition.calories || 0) * ratio),
  protein: nutrition.protein == null ? null : Number((Number(nutrition.protein) * ratio).toFixed(1)),
  carbs: nutrition.carbs == null ? null : Number((Number(nutrition.carbs) * ratio).toFixed(1)),
  fat: nutrition.fat == null ? null : Number((Number(nutrition.fat) * ratio).toFixed(1)),
});

export const calculateFromPer100g = (
  nutrition: NullableNutrition,
  grams: number
): Nutrition | null => {
  if (nutrition.calories == null || !Number.isFinite(grams) || grams <= 0) {
    return null;
  }
  return scaleNutrition({
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
  }, grams / 100);
};

export const isCompleteEnough = (nutrition: NullableNutrition) =>
  nutrition.calories != null && Number.isFinite(nutrition.calories);

const portionTokens = (description: string) =>
  description.toLowerCase().replace(/[^a-z0-9%\s]/g, ' ').split(/\s+/).filter(Boolean);

export const findMatchingPortion = (
  portions: PortionReference[],
  parsed: ParsedQuantity
): PortionReference | null => {
  const withGrams = portions.filter(portion => portion.gramWeight != null && portion.gramWeight > 0);
  if (withGrams.length === 0) return null;

  if (parsed.unitKind === 'volume' && parsed.unit) {
    const unit = parsed.unit.toLowerCase();
    const match = withGrams.find(portion => {
      const haystack = `${portion.description} ${portion.unit || ''}`.toLowerCase();
      return haystack.includes(unit) || (unit === 'cup' && haystack.includes('cup'));
    });
    return match || null;
  }

  if (parsed.unitKind === 'serving') {
    const queryTokens = portionTokens(parsed.foodQuery);
    const extra = parsed.raw.toLowerCase();
    const sizeHints = ['small', 'medium', 'large', 'extra'];
    const hinted = sizeHints.find(size => extra.includes(size));
    if (hinted) {
      const sized = withGrams.find(portion => portion.description.toLowerCase().includes(hinted));
      if (sized) return sized;
    }

    const householdUnits = ['bowl', 'cup', 'slice', 'scoop', 'piece', 'glass', 'bottle'];
    const unitHint = queryTokens.find(token => householdUnits.includes(token));
    if (unitHint) {
      return withGrams.find(portion => portion.description.toLowerCase().includes(unitHint)) || null;
    }

    const household = withGrams.find(portion =>
      /medium|fruit|serving|item|unit|each/i.test(portion.description)
    );
    return household || withGrams[0] || null;
  }

  return null;
};

export const applyParsedQuantityToCandidate = (
  candidate: NutritionCandidate,
  parsed: ParsedQuantity
): {
  nutrition: Nutrition | null;
  quantity: number;
  weightGrams: number | null;
  servingDescription: string | null;
  selectedPortion: PortionReference | null;
  portionResolved: boolean;
} => {
  if (parsed.unitKind === 'weight') {
    const grams = parsed.unit === 'oz' ? ouncesToGrams(parsed.quantity) : parsed.quantity;
    const nutrition = calculateFromPer100g(candidate.nutritionPer100g, grams);
    return {
      nutrition,
      quantity: parsed.quantity,
      weightGrams: Number(grams.toFixed(2)),
      servingDescription: `${parsed.quantity} ${parsed.unit}`,
      selectedPortion: null,
      portionResolved: nutrition != null,
    };
  }

  const matched = findMatchingPortion(candidate.portions, parsed);
  if (matched?.gramWeight) {
    const grams = matched.gramWeight * parsed.quantity;
    const nutrition = calculateFromPer100g(candidate.nutritionPer100g, grams);
    return {
      nutrition,
      quantity: parsed.quantity,
      weightGrams: Number(grams.toFixed(2)),
      servingDescription: parsed.quantity === 1
        ? matched.description
        : `${parsed.quantity} × ${matched.description}`,
      selectedPortion: matched,
      portionResolved: nutrition != null,
    };
  }

  return {
    nutrition: null,
    quantity: parsed.quantity,
    weightGrams: null,
    servingDescription: parsed.raw,
    selectedPortion: null,
    portionResolved: false,
  };
};
