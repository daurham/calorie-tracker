import type { FoodInterpretation } from './food-interpretation';
import type { NutritionConfidence } from './food-log';
import type { PackagedServing } from './packaged-food';

export interface NutritionLabelResult {
  productName: string | null;
  serving: PackagedServing;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  servingsPerContainer: number | null;
  barcode?: string | null;
  confidence: {
    calories: NutritionConfidence;
    protein: NutritionConfidence;
    carbs: NutritionConfidence;
    fat: NutritionConfidence;
  };
}

export interface NutritionLabelWarning {
  code: 'macro_calorie_mismatch';
  message: string;
  expectedCalories: number;
  reportedCalories: number | null;
}

export interface ImageInput {
  mimeType: string;
  dataBase64: string;
  width?: number;
  height?: number;
}

export interface FoodAIProvider {
  extractNutritionLabel(image: ImageInput): Promise<NutritionLabelResult>;
  parseFoodDescription(input: string): Promise<FoodInterpretation>;
  analyzeFoodImage(image: ImageInput, context?: string): Promise<FoodInterpretation>;
}
