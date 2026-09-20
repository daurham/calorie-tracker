import type { FoodSearchResponse } from '../../types/food-search';

async function readSearchResponse(response: Response): Promise<any> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('<')) {
    throw new Error("Couldn't search saved foods.");
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error("Couldn't search saved foods.");
  }
}

export async function searchFoods(query: string): Promise<FoodSearchResponse> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/foods/search?${params.toString()}`);
  const data = await readSearchResponse(response);
  if (!response.ok) {
    throw new Error(data?.error || "Couldn't search saved foods.");
  }
  return data as FoodSearchResponse;
}
