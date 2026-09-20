import type { Nutrition } from '../../types/food-log';

const toNullableNumber = (value: number | string | null | undefined): number | null => {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

export const sumNullableMacros = (
  values: Array<number | string | null | undefined>
): number | null => {
  const known = values
    .map(toNullableNumber)
    .filter((value): value is number => value != null);

  if (known.length === 0) return null;
  return Number(known.reduce((sum, value) => sum + value, 0).toFixed(1));
};

export const sumFoodLogNutrition = (
  logs: Array<Partial<Nutrition>>
): Nutrition => ({
  calories: logs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0),
  protein: sumNullableMacros(logs.map(log => log.protein)),
  carbs: sumNullableMacros(logs.map(log => log.carbs)),
  fat: sumNullableMacros(logs.map(log => log.fat)),
});
