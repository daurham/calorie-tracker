export interface Ingredient {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
  serving_unit: string;
  notes?: string;
}

export interface MealCombo {
  id: number;
  name: string;
  ingredients: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  instructions?: string;
}

export interface MealComboInput {
  name: string;
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
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  ingredients: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
}

const API_BASE_URL = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getIngredients(): Promise<Ingredient[]> {
  const response = await fetchApi<Ingredient[]>(`${API_BASE_URL}/ingredients`);
  return response;
}

export async function addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  const response = await fetchApi<Ingredient>(`${API_BASE_URL}/ingredients`, {
    method: 'POST',
    body: JSON.stringify(ingredient),
  });
  return response as Ingredient;
}

export async function updateIngredient(ingredient: Ingredient): Promise<Ingredient> {
  return fetchApi<Ingredient>(`${API_BASE_URL}/ingredients`, {
    method: 'PUT',
    body: JSON.stringify(ingredient),
  });
}

export async function deleteIngredient(id: number): Promise<Ingredient> {
  return fetchApi<Ingredient>(`${API_BASE_URL}/ingredients?id=${id}`, {
    method: 'DELETE',
  });
}

export async function getMealCombos(): Promise<MealCombo[]> {
  const response = await fetchApi<MealCombo[]>(`${API_BASE_URL}/meal-combos`);
  return response;
}

export async function addMealCombo(combo: Omit<MealCombo, 'id'>): Promise<MealCombo> {
  const response = await fetchApi<MealCombo>(`${API_BASE_URL}/meal-combos`, {
    method: 'POST',
    body: JSON.stringify(combo),
  });
  return response;
}

export async function updateMealCombo(mealCombo: MealCombo): Promise<MealCombo> {
  return fetchApi<MealCombo>(`${API_BASE_URL}/meal-combos?id=${mealCombo.id}`, {
    method: 'PUT',
    body: JSON.stringify(mealCombo),
  });
}

export async function deleteMealCombo(id: number): Promise<MealCombo> {
  return fetchApi<MealCombo>(`${API_BASE_URL}/meal-combos?id=${id}`, {
    method: 'DELETE',
  });
} 