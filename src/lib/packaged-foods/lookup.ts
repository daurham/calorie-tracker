import type { BarcodeLookupResponse, PackagedFoodResult } from '../../types/packaged-food.js';
import { ProviderError } from '../../types/nutrition-provider.js';
import type { OpenFoodFactsProvider } from './off-provider.js';

export interface LocalBarcodeStore {
  findByBarcode(barcode: string): Promise<PackagedFoodResult | null>;
}

export const lookupBarcode = async (
  barcode: string,
  deps: {
    local: LocalBarcodeStore;
    provider: OpenFoodFactsProvider;
  }
): Promise<BarcodeLookupResponse> => {
  const code = String(barcode || '').replace(/\s+/g, '');
  if (!code) {
    return {
      status: 'not_found',
      barcode: '',
      source: 'none',
      usedOpenFoodFacts: false,
      product: null,
      message: 'Enter a barcode.',
    };
  }

  const local = await deps.local.findByBarcode(code);
  if (local) {
    return {
      status: 'found',
      barcode: code,
      source: 'local',
      usedOpenFoodFacts: false,
      product: { ...local, provider: 'local', barcode: code },
    };
  }

  try {
    const product = await deps.provider.getByBarcode(code);
    if (!product) {
      return {
        status: 'not_found',
        barcode: code,
        source: 'none',
        usedOpenFoodFacts: true,
        product: null,
        message: 'Product not found',
      };
    }
    return {
      status: 'found',
      barcode: code,
      source: 'open_food_facts',
      usedOpenFoodFacts: true,
      product,
    };
  } catch (error) {
    const codeName = error instanceof ProviderError ? error.code : 'provider_error';
    return {
      status: 'provider_error',
      barcode: code,
      source: 'none',
      usedOpenFoodFacts: true,
      product: null,
      message: codeName === 'timeout'
        ? 'Open Food Facts timed out.'
        : 'Open Food Facts is unavailable.',
    };
  }
};
