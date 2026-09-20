import type { Nutrition } from './food-log.js';

export type PackagedFoodProvider = 'open_food_facts' | 'nutrition_label' | 'local';

export interface PackagedServing {
  description: string | null;
  amount: number | null;
  unit: string | null;
  gramWeight: number | null;
}

export interface PackagedFoodResult {
  provider: PackagedFoodProvider;
  externalId: string;
  barcode: string;
  name: string;
  brand: string | null;
  nutritionPer100g: Nutrition | null;
  serving: PackagedServing | null;
  nutritionPerServing: Nutrition | null;
  selectedNutrition: Nutrition | null;
  foodId?: number | null;
  metadata?: Record<string, unknown>;
}

export type BarcodeLookupStatus = 'found' | 'not_found' | 'provider_error';

export interface BarcodeLookupResponse {
  status: BarcodeLookupStatus;
  barcode: string;
  source: 'local' | 'open_food_facts' | 'none';
  usedOpenFoodFacts: boolean;
  product: PackagedFoodResult | null;
  message?: string;
}

export interface CanonicalFoodRecord {
  id?: number;
  name: string;
  normalizedName: string;
  foodType: 'packaged';
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  servingAmount: number | null;
  servingUnit: string | null;
  weightGrams: number | null;
  sourceType: 'open_food_facts' | 'nutrition_label';
  sourceExternalId: string | null;
  metadata: Record<string, unknown>;
}

export interface CanonicalUpsertPlan {
  action: 'insert' | 'update';
  existingId: number | null;
  record: CanonicalFoodRecord;
}
