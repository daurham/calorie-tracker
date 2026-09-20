import type {
  AiCacheEntry,
  AiMonthSummary,
  AiRequestType,
  AiUsageRecord,
  BudgetReservation,
} from '../../types/ai-infra';
import { AI_REQUEST_TYPES } from '../../types/ai-infra';
import { calendarMonthRange, loadBudgetConfig } from './config';

export interface ReserveInput {
  provider: string;
  model: string;
  requestType: AiRequestType;
  reservedCostUsd: number;
  metadata?: Record<string, unknown>;
  now?: Date;
}

export interface FinalizeInput {
  success: boolean;
  estimatedCostUsd: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cached?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CacheWriteInput {
  requestHash: string;
  requestType: AiRequestType;
  response: unknown;
  provider?: string;
  model?: string;
  expiresAt?: Date | null;
}

export interface AiInfraStore {
  getCache(requestHash: string, now?: Date): Promise<AiCacheEntry | null>;
  setCache(entry: CacheWriteInput): Promise<void>;
  reserve(input: ReserveInput): Promise<BudgetReservation | null>;
  finalize(id: number, update: FinalizeInput): Promise<void>;
  recordCachedUsage(input: Omit<ReserveInput, 'reservedCostUsd'> & { metadata?: Record<string, unknown> }): Promise<void>;
  getMonthSummary(now?: Date): Promise<AiMonthSummary>;
  listUsage(): Promise<AiUsageRecord[]>;
}

const emptyCounts = (): Record<AiRequestType, number> =>
  Object.fromEntries(AI_REQUEST_TYPES.map(type => [type, 0])) as Record<AiRequestType, number>;

const countsTowardBudget = (row: AiUsageRecord) => {
  if (row.cached) return false;
  if (row.success) return true;
  return row.metadata?.reservation_status === 'pending';
};

export class MemoryAiStore implements AiInfraStore {
  usage: AiUsageRecord[] = [];
  cache = new Map<string, AiCacheEntry>();
  private nextId = 1;
  private lock: Promise<void> = Promise.resolve();

  constructor(private budget = loadBudgetConfig()) {}

  private withLock<T>(fn: () => T | Promise<T>): Promise<T> {
    const run = this.lock.then(fn, fn);
    this.lock = run.then(() => undefined, () => undefined);
    return run;
  }

  async getCache(requestHash: string, now = new Date()) {
    const entry = this.cache.get(requestHash);
    if (!entry) return null;
    if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= now.getTime()) return null;
    return entry;
  }

  async setCache(entry: CacheWriteInput) {
    this.cache.set(entry.requestHash, {
      requestHash: entry.requestHash,
      requestType: entry.requestType,
      response: entry.response,
      provider: entry.provider || null,
      model: entry.model || null,
      createdAt: new Date().toISOString(),
      expiresAt: entry.expiresAt ? entry.expiresAt.toISOString() : null,
    });
  }

  async reserve(input: ReserveInput) {
    return this.withLock(() => {
      const now = input.now || new Date();
      const { start, end } = calendarMonthRange(now);
      const reservedCostUsd = Number(input.reservedCostUsd.toFixed(6));
      const spend = this.usage
        .filter(row => {
          const created = new Date(row.createdAt).getTime();
          return created >= start.getTime() && created < end.getTime() && countsTowardBudget(row);
        })
        .reduce((sum, row) => sum + Number(row.estimatedCostUsd), 0);

      if (spend + reservedCostUsd > this.budget.monthlyBudgetUsd) {
        return null;
      }

      const record: AiUsageRecord = {
        id: this.nextId++,
        provider: input.provider,
        model: input.model,
        requestType: input.requestType,
        inputTokens: null,
        outputTokens: null,
        estimatedCostUsd: reservedCostUsd,
        success: false,
        cached: false,
        metadata: {
          ...(input.metadata || {}),
          reservation_status: 'pending',
          reserved_cost_usd: reservedCostUsd,
        },
        createdAt: now.toISOString(),
      };
      this.usage.push(record);
      return { id: record.id, reservedCostUsd };
    });
  }

  async finalize(id: number, update: FinalizeInput) {
    const row = this.usage.find(item => item.id === id);
    if (!row) return;
    row.success = update.success;
    row.cached = update.cached ?? false;
    row.estimatedCostUsd = Number(update.estimatedCostUsd.toFixed(6));
    row.inputTokens = update.inputTokens ?? null;
    row.outputTokens = update.outputTokens ?? null;
    row.metadata = {
      ...row.metadata,
      ...(update.metadata || {}),
      reservation_status: update.success ? 'committed' : 'released',
    };
  }

  async recordCachedUsage(input: Omit<ReserveInput, 'reservedCostUsd'>) {
    this.usage.push({
      id: this.nextId++,
      provider: input.provider,
      model: input.model,
      requestType: input.requestType,
      inputTokens: null,
      outputTokens: null,
      estimatedCostUsd: 0,
      success: true,
      cached: true,
      metadata: { ...(input.metadata || {}), reservation_status: 'none' },
      createdAt: (input.now || new Date()).toISOString(),
    });
  }

  async getMonthSummary(now = new Date()): Promise<AiMonthSummary> {
    const { start, end, monthKey, monthLabel } = calendarMonthRange(now);
    const monthRows = this.usage.filter(row => {
      const created = new Date(row.createdAt).getTime();
      return created >= start.getTime() && created < end.getTime();
    });
    const countsByType = emptyCounts();
    for (const row of monthRows) countsByType[row.requestType] += 1;
    return {
      monthKey,
      monthLabel,
      spendUsd: Number(monthRows
        .filter(row => row.success && !row.cached)
        .reduce((sum, row) => sum + Number(row.estimatedCostUsd), 0)
        .toFixed(6)),
      reservedUsd: Number(monthRows
        .filter(row => !row.cached && row.metadata?.reservation_status === 'pending')
        .reduce((sum, row) => sum + Number(row.estimatedCostUsd), 0)
        .toFixed(6)),
      monthlyLimitUsd: this.budget.monthlyBudgetUsd,
      warningBudgetUsd: this.budget.warningBudgetUsd,
      requestCount: monthRows.length,
      cachedRequestCount: monthRows.filter(row => row.cached).length,
      countsByType,
    };
  }

  async listUsage() {
    return [...this.usage];
  }
}
