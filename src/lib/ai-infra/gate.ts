import type { AiCallUsage, AiGateCode, AiRequestType } from '../../types/ai-infra';
import { AiGateError } from '../../types/ai-infra';
import { loadAiProviderConfig } from './config';
import { settleCostUsd } from './pricing';
import type { AiInfraStore } from './store';

export const NUTRITION_LABEL_SCHEMA_VERSION = 'nutrition_label.v1';
export const NUTRITION_LABEL_PROMPT_VERSION = 'nutrition_label.prompt.v1';
export const NUTRITION_LABEL_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const BUDGET_EXHAUSTED_MESSAGE =
  'AI processing is unavailable for the rest of this month. You can still enter nutrition manually.';

export interface PaidAiRequest<T> {
  requestType: AiRequestType;
  requestHash: string;
  provider?: string;
  model?: string;
  reservedCostUsd: number;
  metadata?: Record<string, unknown>;
  cacheTtlMs?: number | null;
  now?: Date;
  execute: () => Promise<{ result: T; usage?: Partial<AiCallUsage> }>;
}

export interface PaidAiResult<T> {
  result: T;
  cached: boolean;
  code: AiGateCode;
}

const assertNoImagePayload = (value: unknown) => {
  const json = JSON.stringify(value);
  if (/"dataBase64"\s*:/.test(json) || /"inline_data"\s*:/.test(json)) {
    throw new Error('AI storage must not persist image bytes');
  }
};

export const runPaidAiRequest = async <T>(
  input: PaidAiRequest<T>,
  store: AiInfraStore
): Promise<PaidAiResult<T>> => {
  const config = loadAiProviderConfig();
  const provider = input.provider || config.provider;
  const model = input.model || config.model;
  const now = input.now || new Date();
  const sharedMetadata = {
    ...(input.metadata || {}),
    request_hash: input.requestHash,
    schema_version: input.metadata?.schema_version,
  };
  assertNoImagePayload(sharedMetadata);

  const cached = await store.getCache(input.requestHash, now);
  if (cached) {
    assertNoImagePayload(cached.response);
    await store.recordCachedUsage({
      provider: cached.provider || provider,
      model: cached.model || model,
      requestType: input.requestType,
      metadata: { ...sharedMetadata, cache_hit: true },
      now,
    });
    return { result: cached.response as T, cached: true, code: 'cache_hit' };
  }

  const reservation = await store.reserve({
    provider,
    model,
    requestType: input.requestType,
    reservedCostUsd: input.reservedCostUsd,
    metadata: sharedMetadata,
    now,
  });
  if (!reservation) {
    throw new AiGateError('budget_exhausted', BUDGET_EXHAUSTED_MESSAGE, 503);
  }

  const started = Date.now();
  try {
    const executed = await input.execute();
    const usage = executed.usage || {};
    const latencyMs = usage.latencyMs ?? (Date.now() - started);
    const estimatedCostUsd = settleCostUsd({
      model: usage.model || model,
      inputTokens: usage.inputTokens ?? null,
      outputTokens: usage.outputTokens ?? null,
      reservedCostUsd: reservation.reservedCostUsd,
    });
    const storedResponse = executed.result;
    assertNoImagePayload(storedResponse);

    await store.finalize(reservation.id, {
      success: true,
      estimatedCostUsd,
      inputTokens: usage.inputTokens ?? null,
      outputTokens: usage.outputTokens ?? null,
      metadata: {
        ...sharedMetadata,
        latency_ms: latencyMs,
        cache_hit: false,
      },
    });

    const expiresAt = input.cacheTtlMs === null
      ? null
      : new Date(now.getTime() + (input.cacheTtlMs ?? NUTRITION_LABEL_CACHE_TTL_MS));
    await store.setCache({
      requestHash: input.requestHash,
      requestType: input.requestType,
      response: storedResponse,
      provider,
      model,
      expiresAt,
    });

    return { result: storedResponse, cached: false, code: 'ok' };
  } catch (error) {
    const code = error instanceof AiGateError
      ? error.code
      : (error as { code?: string })?.code === 'timeout'
        ? 'timeout'
        : (error as { code?: string })?.code === 'malformed'
          ? 'invalid_response'
          : (error as { code?: string })?.code === 'missing_key'
            ? 'missing_configuration'
            : 'provider_unavailable';
    await store.finalize(reservation.id, {
      success: false,
      estimatedCostUsd: 0,
      inputTokens: null,
      outputTokens: null,
      metadata: {
        ...sharedMetadata,
        latency_ms: Date.now() - started,
        error_code: code,
        error_message: error instanceof Error ? error.message : 'AI request failed',
      },
    });
    if (error instanceof AiGateError) throw error;
    throw error;
  }
};
