export type MealType = 'composed' | 'standalone' | 'mod';

export interface Ingredient {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
  serving_unit: string;
  unit: string;
  notes?: string;
  is_staple?: boolean;
  quantity: number;
}

export interface MealInput {
  name: string;
  meal_type: MealType;
  ingredients: Array<{
    id: number;
    quantity: number;
  }>;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  instructions?: string;
}

export interface Meal {
  id: number;
  name: string;
  meal_type: MealType;

  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp?: string;
  notes?: string;
  instructions?: string;
  ingredients: Array<Ingredient>;
}

export interface MealCombo {
  id: number;
  name: string;
  meal_type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  instructions?: string;
  ingredients: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
}

export interface CondensedIngredient {
  name: string;
  macros: string;
  unit: string;
  is_staple: boolean;
}

export interface CondensedMeal {
  name: string;
  macros: string;
  ingredients: string;
  notes: string;
  instructions: string;
}

export interface MealPlanData {
  ingredients: CondensedIngredient[];
  meals: CondensedMeal[];
  totalIngredients: number;
  totalMeals: number;
}