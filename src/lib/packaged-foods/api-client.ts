import type { ImageInput, NutritionLabelResult, NutritionLabelWarning } from '../../types/nutrition-label';
import type { BarcodeLookupResponse, PackagedFoodResult } from '../../types/packaged-food';

class PackagedFoodApiError extends Error {
  status: number;
  code?: string;
  fallback?: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, extras: { code?: string; fallback?: string; retryAfterSeconds?: number } = {}) {
    super(message);
    this.name = 'PackagedFoodApiError';
    this.status = status;
    this.code = extras.code;
    this.fallback = extras.fallback;
    this.retryAfterSeconds = extras.retryAfterSeconds;
  }
}

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return { error: response.statusText };
  }
};

export async function lookupBarcodeRequest(barcode: string): Promise<BarcodeLookupResponse> {
  const response = await fetch('/api/barcode/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new PackagedFoodApiError(data.message || data.error || 'Barcode lookup failed', response.status);
  }
  return data as BarcodeLookupResponse;
}

export async function savePackagedFoodRequest(product: PackagedFoodResult, quantity = 1) {
  const response = await fetch('/api/packaged-foods/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, quantity }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new PackagedFoodApiError(data.message || data.error || 'Could not save packaged food', response.status);
  }
  return data as { product: PackagedFoodResult; action: 'insert' | 'update'; foodLog: import('../../types/food-log').FoodLogInput };
}

export async function extractNutritionLabelRequest(
  image: ImageInput,
  barcode?: string | null
): Promise<{ label: NutritionLabelResult; warnings: NutritionLabelWarning[]; persistedImage: false; barcode: string | null }> {
  const response = await fetch('/api/nutrition-label/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, barcode }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new PackagedFoodApiError(
      data.error || 'Label extraction failed',
      response.status,
      { code: data.code, fallback: data.fallback, retryAfterSeconds: data.retryAfterSeconds }
    );
  }
  return data;
}

export { PackagedFoodApiError };
