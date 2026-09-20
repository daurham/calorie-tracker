import type { FoodLogInput } from '../../types/food-log';
import type { CanonicalUpsertPlan, PackagedFoodResult } from '../../types/packaged-food';
import { planCanonicalUpsert } from './canonical';
import { packagedFoodToFoodLogInput } from './log';

export interface CanonicalFoodStore {
  findByBarcode(barcode: string): Promise<PackagedFoodResult | null>;
  upsert(
    record: CanonicalUpsertPlan['record'],
    existingId: number | null
  ): Promise<PackagedFoodResult>;
}

export interface SavePackagedFoodResult {
  product: PackagedFoodResult;
  action: CanonicalUpsertPlan['action'];
  foodLog: FoodLogInput;
}

export const savePackagedFood = async (
  product: PackagedFoodResult,
  quantity: number,
  store: CanonicalFoodStore
): Promise<SavePackagedFoodResult> => {
  const sourceType = product.provider === 'nutrition_label' ? 'nutrition_label' : 'open_food_facts';
  const barcode = String(product.barcode || '').trim();
  const existing = barcode ? await store.findByBarcode(barcode) : null;
  const plan = planCanonicalUpsert(
    existing?.foodId
      ? { id: existing.foodId, sourceExternalId: existing.barcode || existing.externalId }
      : null,
    product,
    sourceType
  );
  const saved = await store.upsert(plan.record, plan.existingId);
  return {
    product: saved,
    action: plan.action,
    foodLog: packagedFoodToFoodLogInput({ ...product, foodId: saved.foodId }, quantity, sourceType),
  };
};
