import { sql } from '@vercel/postgres';
import type { RawSearchRecord } from '../../types/food-search.js';
import { normalizeName, tokenize } from './normalize.js';
import { aggregateHistoricalLogs, attachUsageSignals } from './usage.js';

const toNullableNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const likeFilters = (column: string, tokenCount: number) =>
  Array.from({ length: tokenCount }, (_, index) => `${column} ILIKE '%' || $${index + 1} || '%'`).join(' OR ');

async function searchSource(querySql: string, tokens: string[]) {
  if (tokens.length === 0) return [];
  const result = await sql.query(querySql, tokens);
  return result.rows;
}

export async function loadPersonalSearchRecords(query: string): Promise<RawSearchRecord[]> {
  const tokens = tokenize(String(query));
  const searchTokens = tokens.length > 0 ? tokens : [String(query).trim()];

  const [foods, mealCombos, ingredients, logs, usage] = await Promise.all([
    searchSource(
      `SELECT id, name, normalized_name, calories, protein, carbs, fat,
              serving_amount, serving_unit, confidence, usage_count, last_used_at, attributes
       FROM foods
       WHERE ${likeFilters('normalized_name', searchTokens.length)}
          OR ${likeFilters('name', searchTokens.length)}
       LIMIT 50`,
      searchTokens
    ).catch(() => []),
    searchSource(
      `SELECT id, name, calories, protein, carbs, fat, meal_type
       FROM meal_combos
       WHERE ${likeFilters('name', searchTokens.length)}
       LIMIT 50`,
      searchTokens
    ),
    searchSource(
      `SELECT id, name, calories, protein, carbs, fat, unit
       FROM ingredients
       WHERE ${likeFilters('name', searchTokens.length)}
       LIMIT 50`,
      searchTokens
    ),
    searchSource(
      `SELECT id, display_name, calories, protein, carbs, fat, serving_description,
              logged_at, confidence
       FROM food_logs
       WHERE ${likeFilters('display_name', searchTokens.length)}
       ORDER BY logged_at DESC
       LIMIT 100`,
      searchTokens
    ),
    sql.query(
      `SELECT display_name, COUNT(*)::int AS usage_count, MAX(logged_at) AS last_used_at
       FROM food_logs
       GROUP BY display_name`
    ).then(result => result.rows).catch(() => []),
  ]);

  const usageSignals = usage.map((row: any) => ({
    normalizedName: normalizeName(row.display_name),
    usageCount: Number(row.usage_count) || 0,
    lastUsedAt: row.last_used_at || null,
  }));

  return attachUsageSignals([
    ...foods.map((row: any) => ({
      id: row.id,
      entityType: 'food' as const,
      name: row.name,
      normalizedName: row.normalized_name || normalizeName(row.name),
      calories: Number(row.calories) || 0,
      protein: toNullableNumber(row.protein),
      carbs: toNullableNumber(row.carbs),
      fat: toNullableNumber(row.fat),
      servingDescription: [row.serving_amount, row.serving_unit].filter(Boolean).join(' ') || null,
      confidence: row.confidence || null,
      usageCount: Number(row.usage_count) || 0,
      lastUsedAt: row.last_used_at || null,
      attributes: row.attributes || {},
    })),
    ...mealCombos.map((row: any) => ({
      id: row.id,
      entityType: 'meal_combo' as const,
      name: row.name,
      normalizedName: normalizeName(row.name),
      calories: Number(row.calories) || 0,
      protein: toNullableNumber(row.protein),
      carbs: toNullableNumber(row.carbs),
      fat: toNullableNumber(row.fat),
      servingDescription: row.meal_type || null,
      confidence: null,
      usageCount: 0,
      lastUsedAt: null,
    })),
    ...ingredients.map((row: any) => ({
      id: row.id,
      entityType: 'ingredient' as const,
      name: row.name,
      normalizedName: normalizeName(row.name),
      calories: Number(row.calories) || 0,
      protein: toNullableNumber(row.protein),
      carbs: toNullableNumber(row.carbs),
      fat: toNullableNumber(row.fat),
      servingDescription: row.unit || null,
      confidence: null,
      usageCount: 0,
      lastUsedAt: null,
    })),
    ...aggregateHistoricalLogs(logs.map((row: any) => ({
      id: row.id,
      entityType: 'historical_log' as const,
      name: row.display_name,
      normalizedName: normalizeName(row.display_name),
      calories: Number(row.calories) || 0,
      protein: toNullableNumber(row.protein),
      carbs: toNullableNumber(row.carbs),
      fat: toNullableNumber(row.fat),
      servingDescription: row.serving_description || null,
      confidence: row.confidence || null,
      lastUsedAt: row.logged_at || null,
      loggedAt: row.logged_at || null,
    }))),
  ], usageSignals);
}
