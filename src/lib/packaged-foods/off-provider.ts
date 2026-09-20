import { ProviderError } from '../../types/nutrition-provider';
import type { PackagedFoodResult } from '../../types/packaged-food';
import { normalizeOpenFoodFactsProduct } from './normalize';

const OFF_URL = 'https://world.openfoodfacts.org/api/v0/product';
const DEFAULT_TIMEOUT_MS = 8000;

export interface OffFetch {
  (url: string, init?: RequestInit): Promise<Response>;
}

export class OpenFoodFactsProvider {
  private fetchImpl: OffFetch;
  private timeoutMs: number;

  constructor(options: { fetchImpl?: OffFetch; timeoutMs?: number } = {}) {
    this.fetchImpl = options.fetchImpl || fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async getByBarcode(barcode: string): Promise<PackagedFoodResult | null> {
    const code = String(barcode || '').replace(/\s+/g, '');
    if (!code) throw new ProviderError('malformed', 'Barcode is required');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${OFF_URL}/${encodeURIComponent(code)}.json`, {
        method: 'GET',
        headers: {
          'User-Agent': 'calorie-tracker/2.4 (personal nutrition app)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ProviderError('provider_error', `Open Food Facts failed (${response.status})`);
      }
      const payload = await response.json().catch(() => {
        throw new ProviderError('malformed', 'Open Food Facts returned a malformed response');
      });
      return normalizeOpenFoodFactsProduct(code, payload);
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if ((error as { name?: string })?.name === 'AbortError') {
        throw new ProviderError('timeout', 'Open Food Facts request timed out');
      }
      throw new ProviderError('provider_error', error instanceof Error ? error.message : 'Open Food Facts request failed');
    } finally {
      clearTimeout(timer);
    }
  }
}
