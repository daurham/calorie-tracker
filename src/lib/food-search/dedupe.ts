import type { SearchEntityType } from '../../types/food-search';
import type { ScoredCandidate } from './score';

const ENTITY_PRIORITY: Record<SearchEntityType, number> = {
  food: 0,
  meal_combo: 1,
  ingredient: 2,
  historical_log: 3,
};

const laterDate = (left?: string | null, right?: string | null): string | null => {
  if (!left) return right ?? null;
  if (!right) return left;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
};

const mergeRecords = (keeper: ScoredCandidate, extra: ScoredCandidate): ScoredCandidate => {
  keeper.record = {
    ...keeper.record,
    usageCount: Math.max(keeper.record.usageCount || 0, extra.record.usageCount || 0),
    lastUsedAt: laterDate(keeper.record.lastUsedAt, extra.record.lastUsedAt),
  };
  if (extra.score > keeper.score) {
    keeper.score = extra.score;
    keeper.matchType = extra.matchType;
  }
  return keeper;
};

export const dedupeCandidates = (scored: ScoredCandidate[]): ScoredCandidate[] => {
  const byName = new Map<string, ScoredCandidate>();

  for (const candidate of scored) {
    const existing = byName.get(candidate.normalizedName);
    if (!existing) {
      byName.set(candidate.normalizedName, candidate);
      continue;
    }

    const keepCandidate = ENTITY_PRIORITY[candidate.record.entityType] < ENTITY_PRIORITY[existing.record.entityType];
    byName.set(
      candidate.normalizedName,
      keepCandidate ? mergeRecords(candidate, existing) : mergeRecords(existing, candidate)
    );
  }

  return [...byName.values()];
};
