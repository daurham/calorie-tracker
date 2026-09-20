import type { NutritionLabelResult, NutritionLabelWarning } from '../../types/nutrition-label.js';

export const estimatedMacroCalories = (
  protein: number | null,
  carbs: number | null,
  fat: number | null
): number | null => {
  if (protein == null || carbs == null || fat == null) return null;
  return Number((protein * 4 + carbs * 4 + fat * 9).toFixed(1));
};

export const validateNutritionLabel = (label: NutritionLabelResult): NutritionLabelWarning[] => {
  const expected = estimatedMacroCalories(label.protein, label.carbs, label.fat);
  if (expected == null || label.calories == null) return [];

  const delta = Math.abs(label.calories - expected);
  const ratio = delta / Math.max(label.calories, 1);
  // Ordinary label rounding is ignored; only large gaps are flagged.
  if (delta <= 20 || ratio <= 0.2) return [];

  return [{
    code: 'macro_calorie_mismatch',
    message: `Calories (${label.calories}) differ from macros (~${Math.round(expected)}). Review before saving.`,
    expectedCalories: Math.round(expected),
    reportedCalories: label.calories,
  }];
};

const toNullableNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const sanitizeNutritionLabel = (raw: Partial<NutritionLabelResult> & Record<string, any>): NutritionLabelResult => ({
  productName: raw.productName == null ? null : String(raw.productName).trim() || null,
  serving: {
    description: raw.serving?.description ?? null,
    amount: toNullableNumber(raw.serving?.amount),
    unit: raw.serving?.unit ?? null,
    gramWeight: toNullableNumber(raw.serving?.gramWeight),
  },
  calories: toNullableNumber(raw.calories),
  protein: toNullableNumber(raw.protein),
  carbs: toNullableNumber(raw.carbs),
  fat: toNullableNumber(raw.fat),
  servingsPerContainer: toNullableNumber(raw.servingsPerContainer),
  barcode: raw.barcode ? String(raw.barcode) : null,
  confidence: {
    calories: raw.confidence?.calories || 'medium',
    protein: raw.confidence?.protein || 'medium',
    carbs: raw.confidence?.carbs || 'medium',
    fat: raw.confidence?.fat || 'medium',
  },
});
