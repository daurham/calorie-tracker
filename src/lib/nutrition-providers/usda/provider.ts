import type { NutritionProvider, NutritionReference } from '../../../types/nutrition-provider.js';
import { ProviderError } from '../../../types/nutrition-provider.js';
import { applyParsedQuantityToCandidate } from '../math.js';
import { parseQuantityQuery } from '../../quick-log/quantity.js';
import { normalizeUsdaFood, normalizeUsdaSearchResults } from './normalize.js';

const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const FOOD_URL = 'https://api.nal.usda.gov/fdc/v1/food';
const DEFAULT_TIMEOUT_MS = 8000;

export interface UsdaFetch {
  (url: string, init?: RequestInit): Promise<Response>;
}

const readApiKey = () => {
  const key = process.env.USDA_API_KEY;
  if (!key) {
    throw new ProviderError('missing_key', 'USDA_API_KEY is not configured');
  }
  return key;
};

const fetchWithTimeout = async (
  fetchImpl: UsdaFetch,
  url: string,
  init: RequestInit,
  timeoutMs: number
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if ((error as { name?: string })?.name === 'AbortError') {
      throw new ProviderError('timeout', 'USDA request timed out');
    }
    throw new ProviderError('provider_error', error instanceof Error ? error.message : 'USDA request failed');
  } finally {
    clearTimeout(timer);
  }
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new ProviderError('malformed', 'USDA returned a malformed response');
  }
};

export class USDAFoodDataProvider implements NutritionProvider {
  private fetchImpl: UsdaFetch;
  private timeoutMs: number;
  private apiKey?: string;

  constructor(options: { fetchImpl?: UsdaFetch; timeoutMs?: number; apiKey?: string } = {}) {
    this.fetchImpl = options.fetchImpl || fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.apiKey = options.apiKey;
  }

  private key() {
    return this.apiKey || readApiKey();
  }

  async search(query: string) {
    const key = this.key();
    const url = `${SEARCH_URL}?api_key=${encodeURIComponent(key)}`;
    const response = await fetchWithTimeout(this.fetchImpl, url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        pageSize: 25,
        dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'],
      }),
    }, this.timeoutMs);

    if (!response.ok) {
      throw new ProviderError('provider_error', `USDA search failed (${response.status})`);
    }

    const payload = await parseJson(response);
    return normalizeUsdaSearchResults(payload);
  }

  async getFood(id: string): Promise<NutritionReference> {
    const key = this.key();
    const url = `${FOOD_URL}/${encodeURIComponent(id)}?api_key=${encodeURIComponent(key)}`;
    const response = await fetchWithTimeout(this.fetchImpl, url, { method: 'GET' }, this.timeoutMs);
    if (!response.ok) {
      throw new ProviderError('provider_error', `USDA food lookup failed (${response.status})`);
    }
    const payload = await parseJson(response);
    const candidate = normalizeUsdaFood(payload);
    if (!candidate) {
      throw new ProviderError('malformed', 'USDA food payload was incomplete');
    }
    const applied = applyParsedQuantityToCandidate(candidate, parseQuantityQuery(candidate.name));
    return {
      ...candidate,
      nutrition: applied.nutrition,
      selectedPortion: applied.selectedPortion,
      weightGrams: applied.weightGrams,
      quantity: 1,
      servingDescription: applied.servingDescription,
      portionResolved: applied.portionResolved,
      confidence: applied.portionResolved ? 'medium' : 'low',
    };
  }
}
