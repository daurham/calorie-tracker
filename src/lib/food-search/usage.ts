import type { RawSearchRecord } from '../../types/food-search';
import { normalizeName } from './normalize';

export interface UsageSignal {
  normalizedName: string;
  usageCount: number;
  lastUsedAt: string | null;
}

export const attachUsageSignals = (
  records: RawSearchRecord[],
  usage: UsageSignal[]
): RawSearchRecord[] => {
  const byName = new Map(usage.map(item => [item.normalizedName, item]));
  return records.map(record => {
    const signal = byName.get(record.normalizedName || normalizeName(record.name));
    if (!signal) return record;
    return {
      ...record,
      usageCount: Math.max(record.usageCount || 0, signal.usageCount),
      lastUsedAt: record.lastUsedAt && signal.lastUsedAt
        ? (new Date(record.lastUsedAt) >= new Date(signal.lastUsedAt) ? record.lastUsedAt : signal.lastUsedAt)
        : record.lastUsedAt || signal.lastUsedAt,
    };
  });
};

export const aggregateHistoricalLogs = (
  logs: Array<RawSearchRecord & { loggedAt?: string }>
): RawSearchRecord[] => {
  const latest = new Map<string, RawSearchRecord & { loggedAt?: string }>();
  const counts = new Map<string, number>();

  const sorted = [...logs].sort((left, right) => {
    const leftTime = new Date(left.loggedAt || left.lastUsedAt || 0).getTime();
    const rightTime = new Date(right.loggedAt || right.lastUsedAt || 0).getTime();
    return rightTime - leftTime;
  });

  for (const log of sorted) {
    const key = log.normalizedName || normalizeName(log.name);
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!latest.has(key)) {
      latest.set(key, log);
    }
  }

  return [...latest.entries()].map(([key, log]) => ({
    ...log,
    entityType: 'historical_log',
    normalizedName: key,
    usageCount: counts.get(key) || 1,
    lastUsedAt: log.loggedAt || log.lastUsedAt || null,
  }));
};
