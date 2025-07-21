export interface ModConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version: string;
  author?: string;
}

export interface ModData {
  config: ModConfig;
  data?: any;
}

export interface ModInput {
  type: 'text' | 'number' | 'select' | 'radio' | 'grid-macros';
  label: string;
  key: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  fields?: Array<{
    key: string;
    label: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
  }>;
}

export interface ModCalculation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ModMeal {
  id: string;
  name: string;
  meal_type: 'mod';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  instructions?: string;
  ingredients: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  modId: string;
  modData?: any;
  weight?: number; // Weight in grams for display purposes
}

export interface ModHandler {
  id: string;
  name: string;
  description: string;
  inputs: ModInput[];
  calculate: (inputs: Record<string, any>) => ModCalculation;
  generateMeal: (inputs: Record<string, any>) => ModMeal;
} 