import { sql } from '@vercel/postgres';
import { FOODS_SCHEMA_STATEMENTS } from '../db/foods-schema';
import { normalizeName } from '../food-search/normalize';
import type { CanonicalFoodRecord, PackagedFoodResult } from '../../types/packaged-food';

let tablesReady = false;

export async function ensureFoodsSchema() {
  if (tablesReady) return;
  for (const statement of FOODS_SCHEMA_STATEMENTS) {
    await sql.query(statement);
  }
  tablesReady = true;
}

const toNullableNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const rowToPackagedFood = (row: any): PackagedFoodResult => {
  const metadata = row.metadata || {};
  const serving = metadata.serving || {
    description: row.serving_unit || null,
    amount: toNullableNumber(row.serving_amount),
    unit: row.serving_unit || null,
    gramWeight: toNullableNumber(row.weight_grams),
  };
  const nutrition = {
    calories: Number(row.calories),
    protein: toNullableNumber(row.protein),
    carbs: toNullableNumber(row.carbs),
    fat: toNullableNumber(row.fat),
  };

  return {
    provider: 'local',
    externalId: row.source_external_id,
    barcode: metadata.barcode || row.source_external_id,
    name: row.name,
    brand: metadata.brand || null,
    nutritionPer100g: metadata.nutritionPer100g || null,
    serving,
    nutritionPerServing: metadata.nutritionPerServing || nutrition,
    selectedNutrition: nutrition,
    foodId: Number(row.id),
    metadata: {
      ...metadata,
      localFoodId: row.id,
    },
  };
};

export async function findFoodByBarcode(barcode: string): Promise<PackagedFoodResult | null> {
  await ensureFoodsSchema();
  const result = await sql.query(
    `SELECT * FROM foods
     WHERE source_external_id = $1
        OR metadata->>'barcode' = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [barcode]
  );
  if (result.rows.length === 0) return null;
  return rowToPackagedFood(result.rows[0]);
}

export async function upsertCanonicalFood(record: CanonicalFoodRecord, existingId: number | null) {
  await ensureFoodsSchema();
  if (existingId) {
    const updated = await sql.query(
      `UPDATE foods SET
        name = $1,
        normalized_name = $2,
        calories = $3,
        protein = $4,
        carbs = $5,
        fat = $6,
        serving_amount = $7,
        serving_unit = $8,
        weight_grams = $9,
        source_type = $10,
        source_external_id = $11,
        metadata = COALESCE($12, '{}'::jsonb),
        last_used_at = CURRENT_TIMESTAMP,
        usage_count = usage_count + 1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        record.name,
        record.normalizedName || normalizeName(record.name),
        record.calories,
        record.protein,
        record.carbs,
        record.fat,
        record.servingAmount,
        record.servingUnit,
        record.weightGrams,
        record.sourceType,
        record.sourceExternalId,
        JSON.stringify(record.metadata || {}),
        existingId,
      ]
    );
    return rowToPackagedFood(updated.rows[0]);
  }

  const created = await sql.query(
    `INSERT INTO foods (
      name, normalized_name, food_type, calories, protein, carbs, fat,
      serving_amount, serving_unit, weight_grams, source_type, source_external_id,
      metadata, usage_count, last_used_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13, '{}'::jsonb), 1, CURRENT_TIMESTAMP
    )
    RETURNING *`,
    [
      record.name,
      record.normalizedName || normalizeName(record.name),
      record.foodType,
      record.calories,
      record.protein,
      record.carbs,
      record.fat,
      record.servingAmount,
      record.servingUnit,
      record.weightGrams,
      record.sourceType,
      record.sourceExternalId,
      JSON.stringify(record.metadata || {}),
    ]
  );
  return rowToPackagedFood(created.rows[0]);
}
