import type { EstimateDraft, EstimateOutcome, FoodInterpretation } from '../../types/food-interpretation';
import type { FoodAIProvider, ImageInput } from '../../types/nutrition-label';
import type { NutritionProvider } from '../../types/nutrition-provider';
import { ProviderError } from '../../types/nutrition-provider';
import { AiGateError } from '../../types/ai-infra';
import { loadAiProviderConfig } from '../ai-infra/config';
import { BUDGET_EXHAUSTED_MESSAGE, runPaidAiRequest } from '../ai-infra/gate';
import { buildAiRequestHash, hashImageBytes, normalizeAiText } from '../ai-infra/hash';
import { estimateMaxPhotoCostUsd, estimateMaxTextCostUsd } from '../ai-infra/pricing';
import { estimateBase64Bytes } from '../food-ai/rate-limit';
import type { AiInfraStore } from '../ai-infra/store';
import { MemoryAiStore } from '../ai-infra/store';
import type { FoodSearchResponse } from '../../types/food-search';
import { resolveQuickLog, type ResolveDependencies } from '../quick-log/resolve';
import {
  FOOD_ESTIMATE_CACHE_TTL_MS,
  FOOD_ESTIMATE_RESOLVER_VERSION,
  FOOD_INTERPRETATION_PROMPT_VERSION,
  FOOD_INTERPRETATION_SCHEMA_VERSION,
} from './constants';
import { resolveInterpretation, type InterpretationResolveDeps } from './resolve-interpretation';
import { isLowQualityInterpretation } from './sanitize';

const looksLikeMultipleFoods = (text: string) =>
  /,\s+/.test(text) || /\s+and\s+/i.test(text) || /\s+&\s+/.test(text);

export interface EstimateDependencies extends ResolveDependencies {
  foodAi: FoodAIProvider;
  store?: AiInfraStore;
  requireProviderConfig?: boolean;
}

export interface EstimateTextInput {
  type: 'text';
  text: string;
}

export interface EstimatePhotoInput {
  type: 'photo';
  image: ImageInput;
  text?: string | null;
}

const fail = (code: string, message: string): EstimateOutcome => ({
  status: 'error',
  code,
  message,
  fallback: 'manual',
});

const draftFromResolved = (
  displayName: string,
  originalInput: string,
  items: EstimateDraft['items'],
  extras: Partial<EstimateDraft>
): EstimateDraft => ({
  displayName,
  items,
  assumptions: extras.assumptions || [],
  confidence: extras.confidence || items[0]?.confidence || 'medium',
  usedGemini: extras.usedGemini ?? false,
  cached: extras.cached ?? false,
  originalInput,
  interpretation: extras.interpretation ?? null,
  requestType: extras.requestType || 'none',
});

const tryDeterministic = async (
  text: string,
  deps: EstimateDependencies
): Promise<EstimateDraft | null> => {
  const outcome = await resolveQuickLog({ input: { type: 'text', text } }, deps);
  if (outcome.status === 'local' && (outcome.classification === 'exact' || outcome.classification === 'strong')) {
    const match = outcome.results[0];
    return draftFromResolved(match.name, text, [{
      id: `local-${match.id}`,
      name: match.name,
      servingDescription: match.servingDescription,
      weightGrams: null,
      quantity: 1,
      nutrition: { calories: match.calories, protein: match.protein, carbs: match.carbs, fat: match.fat },
      calorieLow: null,
      calorieHigh: null,
      nutritionSource: 'catalog',
      sourceType: match.entityType === 'historical_log' ? 'historical_log' : match.entityType === 'ingredient' ? 'ingredient' : match.entityType === 'meal_combo' ? 'meal_combo' : 'food',
      confidence: 'high',
      assumptions: [],
      validation: { ok: true, warnings: [], rejected: false },
      referenceName: match.name,
      referenceExternalId: String(match.id),
      canScaleByWeight: false,
      baseNutrition: { calories: match.calories, protein: match.protein, carbs: match.carbs, fat: match.fat },
      baseWeightGrams: null,
      usedAiFallback: false,
    }], { usedGemini: false, requestType: 'none' });
  }

  if (looksLikeMultipleFoods(text)) return null;

  if (
    outcome.status === 'reference'
    && (outcome.classification === 'exact' || outcome.classification === 'strong')
    && outcome.results[0]?.nutrition
  ) {
    const match = outcome.results[0];
    return draftFromResolved(match.name, text, [{
      id: `usda-${match.externalId}`,
      name: match.name,
      servingDescription: match.servingDescription,
      weightGrams: match.weightGrams,
      quantity: match.quantity,
      nutrition: match.nutrition,
      calorieLow: null,
      calorieHigh: null,
      nutritionSource: 'usda',
      sourceType: 'usda',
      confidence: match.confidence,
      assumptions: [],
      validation: { ok: true, warnings: [], rejected: false },
      referenceName: match.name,
      referenceExternalId: match.externalId,
      canScaleByWeight: Boolean(match.weightGrams),
      baseNutrition: match.nutrition,
      baseWeightGrams: match.weightGrams,
      usedAiFallback: false,
    }], { usedGemini: false, requestType: 'none' });
  }

  return null;
};

const callInterpretation = async (
  provider: FoodAIProvider,
  input: EstimateTextInput | EstimatePhotoInput
): Promise<{ result: FoodInterpretation; usage?: any }> => {
  const withUsage = provider as FoodAIProvider & {
    parseFoodDescriptionWithUsage?: (text: string) => Promise<{ result: FoodInterpretation; usage?: any }>;
    analyzeFoodImageWithUsage?: (image: ImageInput, context?: string) => Promise<{ result: FoodInterpretation; usage?: any }>;
  };
  if (input.type === 'text') {
    if (withUsage.parseFoodDescriptionWithUsage) {
      return withUsage.parseFoodDescriptionWithUsage(input.text);
    }
    return { result: await provider.parseFoodDescription(input.text) };
  }
  if (withUsage.analyzeFoodImageWithUsage) {
    return withUsage.analyzeFoodImageWithUsage(input.image, input.text || undefined);
  }
  return { result: await provider.analyzeFoodImage(input.image, input.text || undefined) };
};

export const estimateFood = async (
  input: EstimateTextInput | EstimatePhotoInput,
  deps: EstimateDependencies
): Promise<EstimateOutcome> => {
  const originalInput = input.type === 'text' ? input.text.trim() : (input.text || '').trim() || 'food photo';
  if (input.type === 'text' && !originalInput) {
    return fail('missing_input', 'Enter a food to estimate.');
  }
  if (input.type === 'photo' && !input.image?.dataBase64) {
    return fail('missing_image', 'A photo is required.');
  }

  if (input.type === 'text') {
    const deterministic = await tryDeterministic(originalInput, deps);
    if (deterministic) return { status: 'draft', draft: deterministic };
  }

  if (deps.requireProviderConfig) {
    const config = loadAiProviderConfig();
    if (!config.apiKey || config.provider !== 'gemini') {
      return fail('missing_configuration', "Couldn't estimate this food.");
    }
  }

  const store = deps.store || new MemoryAiStore();
  const config = loadAiProviderConfig();
  const requestType = input.type === 'photo' ? 'photo_estimate' : 'text_parse';
  const requestHash = buildAiRequestHash({
    requestType,
    schemaVersion: FOOD_INTERPRETATION_SCHEMA_VERSION,
    promptVersion: FOOD_INTERPRETATION_PROMPT_VERSION,
    resolverVersion: FOOD_ESTIMATE_RESOLVER_VERSION,
    normalizedText: input.type === 'text' ? normalizeAiText(originalInput) : normalizeAiText(input.text),
    imageSha256: input.type === 'photo' ? hashImageBytes(input.image.dataBase64) : undefined,
  });

  try {
    const gated = await runPaidAiRequest({
      requestType,
      requestHash,
      provider: config.provider,
      model: config.model,
      reservedCostUsd: input.type === 'photo'
        ? estimateMaxPhotoCostUsd(config.model, estimateBase64Bytes(input.image.dataBase64))
        : estimateMaxTextCostUsd(config.model),
      cacheTtlMs: FOOD_ESTIMATE_CACHE_TTL_MS,
      metadata: {
        schema_version: FOOD_INTERPRETATION_SCHEMA_VERSION,
        prompt_version: FOOD_INTERPRETATION_PROMPT_VERSION,
        resolver_version: FOOD_ESTIMATE_RESOLVER_VERSION,
      },
      execute: () => callInterpretation(deps.foodAi, input),
    }, store);

    const interpretation = gated.result;
    if (isLowQualityInterpretation(interpretation) || (!interpretation.displayName && interpretation.components.length === 0)) {
      return fail('invalid_response', "Couldn't estimate this food.");
    }

    const resolveDeps: InterpretationResolveDeps = {
      searchLocal: deps.searchLocal,
      provider: deps.provider,
    };
    const items = await resolveInterpretation(interpretation, resolveDeps);
    if (items.length === 0) {
      return fail('invalid_response', "Couldn't estimate this food.");
    }

    const estimated = items.some(item => item.usedAiFallback);
    return {
      status: 'draft',
      draft: draftFromResolved(interpretation.displayName, originalInput, items, {
        assumptions: interpretation.assumptions,
        confidence: estimated ? (items.every(item => item.confidence === 'low') ? 'low' : 'medium') : items[0].confidence,
        usedGemini: true,
        cached: gated.cached,
        interpretation,
        requestType,
      }),
    };
  } catch (error) {
    if (error instanceof AiGateError && error.code === 'budget_exhausted') {
      return fail('budget_exhausted', 'AI estimates are unavailable for the rest of this month.');
    }
    if (error instanceof ProviderError && error.code === 'timeout') {
      return fail('timeout', "Couldn't estimate this food.");
    }
    if (error instanceof ProviderError && error.code === 'malformed') {
      return fail('invalid_response', "Couldn't estimate this food.");
    }
    return fail(
      error instanceof AiGateError ? error.code : 'provider_unavailable',
      "Couldn't estimate this food."
    );
  }
};

export type { FoodSearchResponse, NutritionProvider };
