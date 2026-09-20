export type FoodLogSourceType =
  | 'ingredient'
  | 'meal_combo'
  | 'food'
  | 'historical_log'
  | 'quick_calories'
  | 'usda'
  | 'open_food_facts'
  | 'nutrition_label'
  | 'ai_estimate'
  | 'mod'
  | 'legacy';

export type FoodLogNutritionSource =
  | 'user_entered'
  | 'legacy'
  | 'usda'
  | 'open_food_facts'
  | 'nutrition_label'
  | 'ai_reference'
  | 'ai_estimate'
  | 'catalog';

export type NutritionConfidence = 'verified' | 'high' | 'medium' | 'low';

export interface Nutrition {
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface FoodLogGroup {
  id: string;
  display_name: string | null;
  original_input: string | null;
  created_at: string;
}

export interface FoodLogMetadata {
  portion?: number;
  isEdited?: boolean;
  mealType?: string;
  uniqueMealId?: number;
  sourceMealId?: number;
  ingredients?: unknown[];
  notes?: string;
  instructions?: string;
  modData?: unknown;
  modId?: string;
  weight?: number;
  [key: string]: unknown;
}

export interface FoodLog {
  id: number;
  logged_at: string;
  group_id: string | null;
  display_name: string;
  source_type: FoodLogSourceType;
  source_id: number | null;
  nutrition_source: FoodLogNutritionSource;
  quantity: number;
  serving_description: string | null;
  weight_grams: number | null;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  confidence: NutritionConfidence | null;
  calorie_low: number | null;
  calorie_high: number | null;
  original_input: string | null;
  metadata: FoodLogMetadata;
  created_at: string;
  updated_at: string;
}

export interface FoodLogInput {
  logged_at?: string;
  group_id?: string | null;
  display_name: string;
  source_type: FoodLogSourceType;
  source_id?: number | null;
  nutrition_source: FoodLogNutritionSource;
  quantity?: number;
  serving_description?: string | null;
  weight_grams?: number | null;
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  confidence?: NutritionConfidence | null;
  calorie_low?: number | null;
  calorie_high?: number | null;
  original_input?: string | null;
  metadata?: FoodLogMetadata;
}

export interface FoodLogGroupInput {
  id?: string;
  display_name?: string | null;
  original_input?: string | null;
}

export interface CreateFoodLogsRequest {
  group?: FoodLogGroupInput;
  logs: FoodLogInput[];
}

export interface FoodLogDateRange {
  from: string;
  to: string;
}

export interface FoodLogsResponse {
  logs: FoodLog[];
  groups: FoodLogGroup[];
}
