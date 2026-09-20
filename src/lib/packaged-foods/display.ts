import type { Nutrition } from '../../types/food-log';
import type { PackagedFoodResult, PackagedServing } from '../../types/packaged-food';

const formatMacro = (value: number | null, suffix: string) =>
  value == null ? `—${suffix}` : `${Number(value.toFixed(value % 1 === 0 ? 0 : 1))}${suffix}`;

export const formatMacroLine = (nutrition: Nutrition | null) => {
  if (!nutrition) return 'Calories unavailable';
  return `${nutrition.calories} cal · ${formatMacro(nutrition.protein, 'P')} · ${formatMacro(nutrition.carbs, 'C')} · ${formatMacro(nutrition.fat, 'F')}`;
};

export const formatServingLine = (serving: PackagedServing | null) => {
  if (!serving) return '1 serving';
  const base = serving.description
    || [serving.amount, serving.unit].filter(value => value != null && value !== '').join(' ')
    || '1 serving';
  if (serving.gramWeight && !String(base).toLowerCase().includes('g')) {
    return `${base} · ${serving.gramWeight}g`;
  }
  return base;
};

export const formatProductSubtitle = (product: PackagedFoodResult) =>
  [product.brand, formatServingLine(product.serving)].filter(Boolean).join(' · ');
