import type { FoodLog } from '../../types/food-log.js';
import type { RawSearchRecord, SearchCandidate } from '../../types/food-search.js';
import { aggregateHistoricalLogs } from '../food-search/usage.js';

export const logsToRecentRecords = (logs: FoodLog[]): RawSearchRecord[] =>
  aggregateHistoricalLogs(logs.map(log => ({
    id: log.id,
    entityType: 'historical_log',
    name: log.display_name,
    calories: log.calories,
    protein: log.protein,
    carbs: log.carbs,
    fat: log.fat,
    servingDescription: log.serving_description,
    confidence: log.confidence,
    lastUsedAt: log.logged_at,
    loggedAt: log.logged_at,
  })));

export const deriveRecentFrequent = (logs: FoodLog[], limit = 8): SearchCandidate[] => {
  const ranked = [...logsToRecentRecords(logs)].sort((left, right) => {
    const rightTime = new Date(right.lastUsedAt || 0).getTime();
    const leftTime = new Date(left.lastUsedAt || 0).getTime();
    if (rightTime !== leftTime) return rightTime - leftTime;
    return (right.usageCount || 0) - (left.usageCount || 0);
  });

  return ranked.slice(0, limit).map(record => ({
    id: record.id,
    entityType: record.entityType,
    name: record.name,
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    servingDescription: record.servingDescription ?? null,
    source: 'previous_log',
    confidence: record.confidence ?? null,
    usageCount: record.usageCount || 0,
    lastUsedAt: record.lastUsedAt ?? null,
    match: { score: 1, type: 'strong' },
  }));
};
