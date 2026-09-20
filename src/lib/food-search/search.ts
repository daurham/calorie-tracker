import type {
  FoodSearchResponse,
  RawSearchRecord,
  SearchCandidate,
} from '../../types/food-search.js';
import { classifySearchResults } from './classify.js';
import { dedupeCandidates } from './dedupe.js';
import { scoreCandidate } from './score.js';

const SOURCE_BY_ENTITY = {
  food: 'food',
  meal_combo: 'meal_combo',
  ingredient: 'ingredient',
  historical_log: 'previous_log',
} as const;

const toNullableNumber = (value: number | string | null | undefined): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const searchLocalKnowledge = (
  query: string,
  records: RawSearchRecord[],
  limit = 15
): FoodSearchResponse => {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query, classification: 'none', results: [] };
  }

  const scored = records
    .map(record => scoreCandidate(trimmed, record))
    .filter(item => item.matchType !== 'none');
  const deduped = dedupeCandidates(scored)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if ((right.record.usageCount || 0) !== (left.record.usageCount || 0)) {
        return (right.record.usageCount || 0) - (left.record.usageCount || 0);
      }
      return left.record.name.localeCompare(right.record.name);
    });

  const classification = classifySearchResults(trimmed, deduped);
  const results: SearchCandidate[] = deduped.slice(0, limit).map(item => ({
    id: item.record.id,
    entityType: item.record.entityType,
    name: item.record.name,
    calories: Math.round(Number(item.record.calories) || 0),
    protein: toNullableNumber(item.record.protein),
    carbs: toNullableNumber(item.record.carbs),
    fat: toNullableNumber(item.record.fat),
    servingDescription: item.record.servingDescription ?? null,
    source: SOURCE_BY_ENTITY[item.record.entityType],
    confidence: item.record.confidence ?? null,
    usageCount: item.record.usageCount || 0,
    lastUsedAt: item.record.lastUsedAt ?? null,
    attributes: item.attributes,
    match: {
      score: item.score,
      type: item.matchType,
    },
  }));

  return { query: trimmed, classification, results };
};
