export const AI_REQUEST_TYPES = [
  'nutrition_label',
  'text_parse',
  'food_estimate',
  'photo_estimate',
] as const;

export type AiRequestType = (typeof AI_REQUEST_TYPES)[number];

export type AiGateCode =
  | 'ok'
  | 'cache_hit'
  | 'budget_exhausted'
  | 'rate_limited'
  | 'missing_configuration'
  | 'timeout'
  | 'invalid_response'
  | 'provider_unavailable';

export interface AiCallUsage {
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs?: number;
}

export interface AiUsageRecord {
  id: number;
  provider: string;
  model: string;
  requestType: AiRequestType;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number;
  success: boolean;
  cached: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AiCacheEntry {
  requestHash: string;
  requestType: AiRequestType;
  response: unknown;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface AiBudgetConfig {
  monthlyBudgetUsd: number;
  warningBudgetUsd: number;
}

export interface AiMonthSummary {
  monthKey: string;
  monthLabel: string;
  spendUsd: number;
  reservedUsd: number;
  monthlyLimitUsd: number;
  warningBudgetUsd: number;
  requestCount: number;
  cachedRequestCount: number;
  countsByType: Record<AiRequestType, number>;
}

export interface AiHashInput {
  requestType: AiRequestType;
  schemaVersion: string;
  promptVersion?: string;
  resolverVersion?: string;
  normalizedText?: string;
  imageSha256?: string;
}

export interface BudgetReservation {
  id: number;
  reservedCostUsd: number;
}

export class AiGateError extends Error {
  code: AiGateCode;
  status: number;

  constructor(code: AiGateCode, message: string, status = 503) {
    super(message);
    this.name = 'AiGateError';
    this.code = code;
    this.status = status;
  }
}
