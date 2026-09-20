import type { Nutrition, NutritionConfidence } from './food-log';

export type NutritionProviderId = 'usda';

export interface NullableNutrition {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface PortionReference {
  description: string;
  amount: number | null;
  unit: string | null;
  gramWeight: number | null;
}

export interface NutritionCandidate {
  provider: NutritionProviderId;
  externalId: string;
  name: string;
  nutritionPer100g: NullableNutrition;
  portions: PortionReference[];
  metadata?: {
    dataType?: string;
    brandOwner?: string;
    description?: string;
  };
}

export interface NutritionReference extends NutritionCandidate {
  nutrition: Nutrition | null;
  selectedPortion: PortionReference | null;
  weightGrams: number | null;
  quantity: number;
  servingDescription: string | null;
  portionResolved: boolean;
  confidence: NutritionConfidence;
}

export interface NutritionProvider {
  search(query: string): Promise<NutritionCandidate[]>;
  getFood(id: string): Promise<NutritionReference>;
}

export class ProviderError extends Error {
  code: 'missing_key' | 'timeout' | 'provider_error' | 'malformed';

  constructor(code: ProviderError['code'], message: string) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}
