import type { Nutrition, NutritionConfidence } from './food-log';

export type SearchEntityType = 'food' | 'meal_combo' | 'ingredient' | 'historical_log';

export type MatchClassification = 'exact' | 'strong' | 'ambiguous' | 'weak' | 'none';

export interface FoodAttributes {
  food_family?: string;
  protein?: string;
  filling?: string;
  preparation?: string;
  size?: string;
  milk_fat?: string;
  sweetness?: string;
  [key: string]: string | undefined;
}

export interface SearchMatch {
  score: number;
  type: MatchClassification;
}

export interface SearchCandidate extends Nutrition {
  id: number | string;
  entityType: SearchEntityType;
  name: string;
  servingDescription: string | null;
  source: 'food' | 'meal_combo' | 'ingredient' | 'previous_log';
  confidence: NutritionConfidence | null;
  usageCount: number;
  lastUsedAt: string | null;
  attributes?: FoodAttributes;
  match: SearchMatch;
}

export interface FoodSearchResponse {
  query: string;
  classification: MatchClassification;
  results: SearchCandidate[];
}

export interface RawSearchRecord {
  id: number | string;
  entityType: SearchEntityType;
  name: string;
  normalizedName?: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  servingDescription?: string | null;
  confidence?: NutritionConfidence | null;
  usageCount?: number;
  lastUsedAt?: string | null;
  attributes?: FoodAttributes;
}
