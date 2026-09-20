import { sql } from '@vercel/postgres';
import type { AiCacheEntry, AiMonthSummary, AiRequestType, AiUsageRecord } from '../../types/ai-infra';
import { AI_REQUEST_TYPES } from '../../types/ai-infra';
import { AI_SCHEMA_STATEMENTS } from '../db/ai-schema';
import { calendarMonthRange, loadBudgetConfig } from './config';
import type { AiInfraStore, CacheWriteInput, FinalizeInput, ReserveInput } from './store';

let tablesReady = false;

export async function ensureAiSchema() {
  if (tablesReady) return;
  for (const statement of AI_SCHEMA_STATEMENTS) {
    await sql.query(statement);
  }
  tablesReady = true;
}

const emptyCounts = (): Record<AiRequestType, number> =>
  Object.fromEntries(AI_REQUEST_TYPES.map(type => [type, 0])) as Record<AiRequestType, number>;

const toRecord = (row: any): AiUsageRecord => ({
  id: Number(row.id),
  provider: row.provider,
  model: row.model,
  requestType: row.request_type,
  inputTokens: row.input_tokens == null ? null : Number(row.input_tokens),
  outputTokens: row.output_tokens == null ? null : Number(row.output_tokens),
  estimatedCostUsd: Number(row.estimated_cost_usd),
  success: Boolean(row.success),
  cached: Boolean(row.cached),
  metadata: row.metadata || {},
  createdAt: new Date(row.created_at).toISOString(),
});

export class PostgresAiStore implements AiInfraStore {
  constructor(private budget = loadBudgetConfig()) {}

  async getCache(requestHash: string, now = new Date()): Promise<AiCacheEntry | null> {
    await ensureAiSchema();
    const result = await sql.query(
      `SELECT * FROM ai_cache
       WHERE request_hash = $1
         AND (expires_at IS NULL OR expires_at > $2)
       LIMIT 1`,
      [requestHash, now.toISOString()]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      requestHash: row.request_hash,
      requestType: row.request_type,
      response: row.response,
      provider: row.provider,
      model: row.model,
      createdAt: new Date(row.created_at).toISOString(),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    };
  }

  async setCache(entry: CacheWriteInput) {
    await ensureAiSchema();
    await sql.query(
      `INSERT INTO ai_cache (request_hash, request_type, response, provider, model, expires_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6)
       ON CONFLICT (request_hash) DO UPDATE SET
         response = EXCLUDED.response,
         provider = EXCLUDED.provider,
         model = EXCLUDED.model,
         expires_at = EXCLUDED.expires_at,
         created_at = CURRENT_TIMESTAMP`,
      [
        entry.requestHash,
        entry.requestType,
        JSON.stringify(entry.response),
        entry.provider || null,
        entry.model || null,
        entry.expiresAt ? entry.expiresAt.toISOString() : null,
      ]
    );
  }

  async reserve(input: ReserveInput) {
    await ensureAiSchema();
    const now = input.now || new Date();
    const { start, end, monthOrdinal } = calendarMonthRange(now);
    const reservedCostUsd = Number(input.reservedCostUsd.toFixed(6));
    const metadata = {
      ...(input.metadata || {}),
      reservation_status: 'pending',
      reserved_cost_usd: reservedCostUsd,
    };

    const result = await sql.query(
      `WITH lock AS (
         SELECT pg_advisory_xact_lock(872134, $1)
       ),
       spend AS (
         SELECT COALESCE(SUM(estimated_cost_usd), 0) AS total
         FROM ai_usage, lock
         WHERE created_at >= $2
           AND created_at < $3
           AND cached = false
           AND (
             success = true
             OR COALESCE(metadata->>'reservation_status', '') = 'pending'
           )
       )
       INSERT INTO ai_usage (
         provider, model, request_type, estimated_cost_usd, success, cached, metadata, created_at
       )
       SELECT $4, $5, $6, $7, false, false, $8::jsonb, $9
       FROM spend
       WHERE spend.total + $7 <= $10
       RETURNING *`,
      [
        monthOrdinal,
        start.toISOString(),
        end.toISOString(),
        input.provider,
        input.model,
        input.requestType,
        reservedCostUsd,
        JSON.stringify(metadata),
        now.toISOString(),
        this.budget.monthlyBudgetUsd,
      ]
    );

    if (result.rows.length === 0) return null;
    return { id: Number(result.rows[0].id), reservedCostUsd };
  }

  async finalize(id: number, update: FinalizeInput) {
    await ensureAiSchema();
    await sql.query(
      `UPDATE ai_usage SET
         success = $2,
         cached = $3,
         estimated_cost_usd = $4,
         input_tokens = $5,
         output_tokens = $6,
         metadata = COALESCE(metadata, '{}'::jsonb) || $7::jsonb
       WHERE id = $1`,
      [
        id,
        update.success,
        update.cached ?? false,
        Number(update.estimatedCostUsd.toFixed(6)),
        update.inputTokens ?? null,
        update.outputTokens ?? null,
        JSON.stringify({
          ...(update.metadata || {}),
          reservation_status: update.success ? 'committed' : 'released',
        }),
      ]
    );
  }

  async recordCachedUsage(input: Omit<ReserveInput, 'reservedCostUsd'>) {
    await ensureAiSchema();
    await sql.query(
      `INSERT INTO ai_usage (
         provider, model, request_type, estimated_cost_usd, success, cached, metadata, created_at
       ) VALUES ($1, $2, $3, 0, true, true, $4::jsonb, $5)`,
      [
        input.provider,
        input.model,
        input.requestType,
        JSON.stringify({ ...(input.metadata || {}), reservation_status: 'none' }),
        (input.now || new Date()).toISOString(),
      ]
    );
  }

  async getMonthSummary(now = new Date()): Promise<AiMonthSummary> {
    await ensureAiSchema();
    const { start, end, monthKey, monthLabel } = calendarMonthRange(now);
    const result = await sql.query(
      `SELECT
         COALESCE(SUM(estimated_cost_usd) FILTER (WHERE success = true AND cached = false), 0) AS spend,
         COALESCE(SUM(estimated_cost_usd) FILTER (
           WHERE cached = false AND COALESCE(metadata->>'reservation_status', '') = 'pending'
         ), 0) AS reserved,
         COUNT(*)::int AS request_count,
         COUNT(*) FILTER (WHERE cached = true)::int AS cached_count,
         request_type
       FROM ai_usage
       WHERE created_at >= $1 AND created_at < $2
       GROUP BY request_type`,
      [start.toISOString(), end.toISOString()]
    );

    const countsByType = emptyCounts();
    let spendUsd = 0;
    let reservedUsd = 0;
    let requestCount = 0;
    let cachedRequestCount = 0;
    for (const row of result.rows) {
      countsByType[row.request_type as AiRequestType] = Number(row.request_count);
      spendUsd += Number(row.spend);
      reservedUsd += Number(row.reserved);
      requestCount += Number(row.request_count);
      cachedRequestCount += Number(row.cached_count);
    }

    return {
      monthKey,
      monthLabel,
      spendUsd: Number(spendUsd.toFixed(6)),
      reservedUsd: Number(reservedUsd.toFixed(6)),
      monthlyLimitUsd: this.budget.monthlyBudgetUsd,
      warningBudgetUsd: this.budget.warningBudgetUsd,
      requestCount,
      cachedRequestCount,
      countsByType,
    };
  }

  async listUsage() {
    await ensureAiSchema();
    const result = await sql.query(`SELECT * FROM ai_usage ORDER BY id`);
    return result.rows.map(toRecord);
  }
}
