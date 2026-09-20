import { ProviderError } from '../../types/nutrition-provider';
import { AiGateError } from '../../types/ai-infra';
import type { FoodAIProvider, ImageInput, NutritionLabelResult, NutritionLabelWarning } from '../../types/nutrition-label';
import {
  NUTRITION_LABEL_CACHE_TTL_MS,
  NUTRITION_LABEL_PROMPT_VERSION,
  NUTRITION_LABEL_SCHEMA_VERSION,
  runPaidAiRequest,
} from '../ai-infra/gate';
import { hashNutritionLabelRequest } from '../ai-infra/hash';
import { estimateMaxLabelCostUsd } from '../ai-infra/pricing';
import { loadAiProviderConfig } from '../ai-infra/config';
import { MemoryAiStore, type AiInfraStore } from '../ai-infra/store';
import { checkRateLimit, estimateBase64Bytes, LABEL_RATE_LIMIT } from './rate-limit';
import { sanitizeNutritionLabel, validateNutritionLabel } from './validate-label';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export interface ExtractRequest {
  image?: Partial<ImageInput> | null;
  barcode?: string | null;
  clientKey: string;
}

export type ExtractResponse =
  | {
      ok: true;
      status: 200;
      body: {
        label: NutritionLabelResult;
        warnings: NutritionLabelWarning[];
        persistedImage: false;
        barcode: string | null;
        cached?: boolean;
      };
    }
  | {
      ok: false;
      status: number;
      body: {
        error: string;
        code: string;
        fallback: 'manual';
        retryAfterSeconds?: number;
        persistedImage: false;
      };
    };

const fail = (
  status: number,
  code: string,
  error: string,
  retryAfterSeconds?: number
): ExtractResponse => ({
  ok: false,
  status,
  body: { error, code, fallback: 'manual', retryAfterSeconds, persistedImage: false },
});

const callLabelProvider = async (provider: FoodAIProvider, image: ImageInput) => {
  const withUsage = provider as FoodAIProvider & {
    extractNutritionLabelWithUsage?: (input: ImageInput) => Promise<{ result: NutritionLabelResult; usage?: any }>;
  };
  if (typeof withUsage.extractNutritionLabelWithUsage === 'function') {
    return withUsage.extractNutritionLabelWithUsage(image);
  }
  return { result: await provider.extractNutritionLabel(image) };
};

export const handleExtractNutritionLabel = async (
  input: ExtractRequest,
  deps: {
    provider: FoodAIProvider;
    store?: AiInfraStore;
    now?: number;
    requireProviderConfig?: boolean;
  }
): Promise<ExtractResponse> => {
  const mimeType = input.image?.mimeType || '';
  const dataBase64 = input.image?.dataBase64 || '';
  if (!dataBase64) {
    return fail(400, 'missing_image', 'An image is required for label extraction.');
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    return fail(400, 'invalid_image', 'Use a JPEG, PNG, or WebP nutrition-label photo.');
  }
  if (estimateBase64Bytes(dataBase64) > LABEL_RATE_LIMIT.maxImageBytes) {
    return fail(413, 'image_too_large', 'Image is too large. Compress it and try again.');
  }

  const limit = checkRateLimit(input.clientKey || 'anonymous', deps.now);
  if (!limit.allowed) {
    return fail(429, 'rate_limited', 'Too many label scans. Try again shortly.', limit.retryAfterSeconds);
  }

  if (deps.requireProviderConfig) {
    const config = loadAiProviderConfig();
    if (!config.apiKey) {
      return fail(503, 'missing_configuration', 'AI processing is unavailable. You can still enter nutrition manually.');
    }
    if (config.provider !== 'gemini') {
      return fail(503, 'missing_configuration', 'AI processing is unavailable. You can still enter nutrition manually.');
    }
  }

  const image = { mimeType, dataBase64 };
  const requestHash = hashNutritionLabelRequest({
    dataBase64,
    accompanyingText: input.barcode,
    schemaVersion: NUTRITION_LABEL_SCHEMA_VERSION,
    promptVersion: NUTRITION_LABEL_PROMPT_VERSION,
  });
  const store = deps.store || new MemoryAiStore();
  const config = loadAiProviderConfig();

  try {
    const gated = await runPaidAiRequest({
      requestType: 'nutrition_label',
      requestHash,
      provider: config.provider,
      model: config.model,
      reservedCostUsd: estimateMaxLabelCostUsd(config.model, estimateBase64Bytes(dataBase64)),
      cacheTtlMs: NUTRITION_LABEL_CACHE_TTL_MS,
      now: deps.now ? new Date(deps.now) : undefined,
      metadata: {
        schema_version: NUTRITION_LABEL_SCHEMA_VERSION,
        prompt_version: NUTRITION_LABEL_PROMPT_VERSION,
        barcode_present: Boolean(input.barcode),
      },
      execute: async () => {
        const extracted = await callLabelProvider(deps.provider, image);
        return {
          result: {
            label: sanitizeNutritionLabel({
              ...extracted.result,
              barcode: input.barcode || extracted.result.barcode || null,
            }),
            persistedImage: false as const,
          },
          usage: extracted.usage,
        };
      },
    }, store);

    const label = gated.result.label;
    return {
      ok: true,
      status: 200,
      body: {
        label,
        warnings: validateNutritionLabel(label),
        persistedImage: false,
        barcode: label.barcode || input.barcode || null,
        cached: gated.cached,
      },
    };
  } catch (error) {
    if (error instanceof AiGateError) {
      return fail(error.status, error.code, error.message);
    }
    const code = error instanceof ProviderError ? error.code : 'provider_error';
    if (code === 'missing_key') {
      return fail(503, 'missing_configuration', 'AI processing is unavailable. You can still enter nutrition manually.');
    }
    if (code === 'timeout') {
      return fail(504, 'timeout', error instanceof Error ? error.message : 'Label extraction timed out.');
    }
    if (code === 'malformed') {
      return fail(502, 'invalid_response', 'Label extraction could not be read. Enter the values manually.');
    }
    return fail(502, 'provider_unavailable', error instanceof Error ? error.message : 'Label extraction failed.');
  }
};
