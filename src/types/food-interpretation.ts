import type { FoodLogNutritionSource, FoodLogSourceType, Nutrition, NutritionConfidence } from './food-log.js';

export interface FoodComponent {
  name: string;
  quantityDescription: string | null;
  estimatedWeightGrams: number | null;
  attributes?: {
    preparation?: string;
    filling?: string;
    size?: string;
    [key: string]: unknown;
  };
}

export interface FallbackNutrition {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  calorieLow: number | null;
  calorieHigh: number | null;
}

export interface FoodInterpretation {
  displayName: string;
  portion: {
    description: string | null;
    estimatedWeightGrams: number | null;
  };
  components: FoodComponent[];
  assumptions: string[];
  confidence: 'high' | 'medium' | 'low';
  fallbackNutrition?: FallbackNutrition | null;
}

export interface EstimateValidation {
  ok: boolean;
  warnings: string[];
  rejected: boolean;
}

export interface EstimateItem {
  id: string;
  name: string;
  servingDescription: string | null;
  weightGrams: number | null;
  quantity: number;
  nutrition: Nutrition;
  calorieLow: number | null;
  calorieHigh: number | null;
  nutritionSource: FoodLogNutritionSource;
  sourceType: FoodLogSourceType;
  confidence: NutritionConfidence;
  assumptions: string[];
  validation: EstimateValidation;
  referenceName?: string | null;
  referenceExternalId?: string | null;
  canScaleByWeight: boolean;
  baseNutrition: Nutrition;
  baseWeightGrams: number | null;
  usedAiFallback: boolean;
}

export interface EstimateDraft {
  displayName: string;
  items: EstimateItem[];
  assumptions: string[];
  confidence: NutritionConfidence;
  usedGemini: boolean;
  cached: boolean;
  originalInput: string;
  interpretation: FoodInterpretation | null;
  requestType: 'text_parse' | 'photo_estimate' | 'none';
}

export interface EstimateFailure {
  status: 'error';
  code: string;
  message: string;
  fallback: 'manual';
}

export type EstimateOutcome =
  | { status: 'draft'; draft: EstimateDraft }
  | EstimateFailure;

