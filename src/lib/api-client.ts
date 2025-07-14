import { Ingredient, MealCombo } from '@/types';

// Custom error type for API responses
class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
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
    // Try to parse the error response as JSON
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    
    // Create a custom error that preserves the response data
    const error = new ApiError(
      errorData.message || errorData.error || `API error: ${response.statusText}`,
      response.status,
      errorData
    );
    throw error;
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