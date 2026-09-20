import type { FoodSearchResponse } from '../../types/food-search';

export async function searchFoods(query: string): Promise<FoodSearchResponse> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/foods/search?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || 'Food search failed');
  }
  return response.json();
}
