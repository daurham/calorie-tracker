import { pool } from '../src/lib/db/client';
import type { PoolClient } from 'pg';
import {
  INGREDIENTS_PATH,
  MEALS_PATH,
  normalizeName,
  readJson,
  toNumber,
  type CatalogIngredient,
  type CatalogMeal,
  type IngredientsFile,
  type MealsFile,
} from './lib/catalog';

interface CliOptions {
  dryRun: boolean;
  ingredientsOnly: boolean;
  mealsOnly: boolean;
}

interface IngredientRow {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  is_staple: boolean;
}

interface MealRow {
  id: number;
  name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string | null;
  instructions: string | null;
}

function parseArgs(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes('--dry-run'),
    ingredientsOnly: argv.includes('--ingredients-only'),
    mealsOnly: argv.includes('--meals-only'),
  };
}

function validateIngredient(raw: CatalogIngredient, index: number): CatalogIngredient {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`ingredients[${index}] must be an object`);
  }
  if (!raw.name || typeof raw.name !== 'string' || !raw.name.trim()) {
    throw new Error(`ingredients[${index}].name is required`);
  }
  if (!raw.unit || typeof raw.unit !== 'string' || !raw.unit.trim()) {
    throw new Error(`ingredients[${index}] ("${raw.name}") requires unit`);
  }

  return {
    id: raw.id != null ? toNumber(raw.id, `ingredients[${index}].id`) : undefined,
    name: raw.name.trim(),
    calories: toNumber(raw.calories, `ingredients[${index}].calories`),
    protein: toNumber(raw.protein, `ingredients[${index}].protein`),
    carbs: toNumber(raw.carbs, `ingredients[${index}].carbs`),
    fat: toNumber(raw.fat, `ingredients[${index}].fat`),
    unit: raw.unit.trim(),
    is_staple: Boolean(raw.is_staple),
  };
}

function validateMeal(raw: CatalogMeal, index: number): CatalogMeal {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`meals[${index}] must be an object`);
  }
  if (!raw.name || typeof raw.name !== 'string' || !raw.name.trim()) {
    throw new Error(`meals[${index}].name is required`);
  }
  if (raw.meal_type !== 'composed' && raw.meal_type !== 'standalone') {
    throw new Error(`meals[${index}] ("${raw.name}") meal_type must be "composed" or "standalone"`);
  }

  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((ing, j) => {
        if (!ing?.name || typeof ing.name !== 'string') {
          throw new Error(`meals[${index}].ingredients[${j}].name is required`);
        }
        return {
          name: ing.name.trim(),
          quantity: toNumber(ing.quantity, `meals[${index}].ingredients[${j}].quantity`),
        };
      })
    : [];

  if (raw.meal_type === 'composed' && ingredients.length === 0) {
    throw new Error(`meals[${index}] ("${raw.name}") composed meals need at least one ingredient`);
  }

  const meal: CatalogMeal = {
    id: raw.id != null ? toNumber(raw.id, `meals[${index}].id`) : undefined,
    name: raw.name.trim(),
    meal_type: raw.meal_type,
    notes: raw.notes ?? null,
    instructions: raw.instructions ?? null,
    ingredients: raw.meal_type === 'composed' ? ingredients : [],
  };

  if (raw.meal_type === 'standalone') {
    meal.calories = toNumber(raw.calories ?? 0, `meals[${index}].calories`);
    meal.protein = toNumber(raw.protein ?? 0, `meals[${index}].protein`);
    meal.carbs = toNumber(raw.carbs ?? 0, `meals[${index}].carbs`);
    meal.fat = toNumber(raw.fat ?? 0, `meals[${index}].fat`);
  } else {
    meal.calories = raw.calories != null ? toNumber(raw.calories, `meals[${index}].calories`) : 0;
    meal.protein = raw.protein != null ? toNumber(raw.protein, `meals[${index}].protein`) : 0;
    meal.carbs = raw.carbs != null ? toNumber(raw.carbs, `meals[${index}].carbs`) : 0;
    meal.fat = raw.fat != null ? toNumber(raw.fat, `meals[${index}].fat`) : 0;
  }

  return meal;
}

async function loadIngredientMaps(client: PoolClient) {
  const result = await client.query(
    `SELECT id, name, calories, protein, carbs, fat, unit, COALESCE(is_staple, false) AS is_staple
     FROM ingredients`
  );
  const byId = new Map<number, IngredientRow>();
  const byName = new Map<string, IngredientRow>();
  for (const row of result.rows as IngredientRow[]) {
    byId.set(Number(row.id), row);
    byName.set(normalizeName(String(row.name)), row);
  }
  return { byId, byName };
}

async function loadMealMaps(client: PoolClient) {
  const result = await client.query('SELECT id, name FROM meal_combos');
  const byId = new Map<number, { id: number; name: string }>();
  const byName = new Map<string, { id: number; name: string }>();
  for (const row of result.rows as Array<{ id: number; name: string }>) {
    byId.set(Number(row.id), row);
    byName.set(normalizeName(String(row.name)), row);
  }
  return { byId, byName };
}

function resolveByIdOrName(
  id: number | undefined,
  name: string,
  byId: Map<number, { id: number }>,
  byName: Map<string, { id: number }>
): number | null {
  if (id != null && byId.has(id)) return id;
  const existing = byName.get(normalizeName(name));
  return existing ? existing.id : null;
}

async function importIngredients(
  client: PoolClient,
  items: CatalogIngredient[],
  dryRun: boolean
) {
  const stats = { created: 0, updated: 0, unchanged: 0 };
  const { byId, byName } = await loadIngredientMaps(client);

  for (const item of items) {
    const existingId = resolveByIdOrName(item.id, item.name, byId, byName);
    const payload = [
      item.name,
      item.calories,
      item.protein,
      item.carbs,
      item.fat,
      item.unit,
      item.is_staple ?? false,
    ];

    if (existingId == null) {
      stats.created += 1;
      console.log(`  + create ingredient: ${item.name}`);
      if (!dryRun) {
        const result = await client.query(
          `INSERT INTO ingredients (name, calories, protein, carbs, fat, unit, is_staple)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, name, calories, protein, carbs, fat, unit, is_staple`,
          payload
        );
        const row = result.rows[0] as IngredientRow;
        byId.set(Number(row.id), row);
        byName.set(normalizeName(row.name), row);
      }
      continue;
    }

    const current = byId.get(existingId)!;
    const same =
      String(current.name) === item.name &&
      Number(current.calories) === item.calories &&
      Number(current.protein) === item.protein &&
      Number(current.carbs) === item.carbs &&
      Number(current.fat) === item.fat &&
      String(current.unit) === item.unit &&
      Boolean(current.is_staple) === Boolean(item.is_staple ?? false);

    if (same) {
      stats.unchanged += 1;
      continue;
    }

    stats.updated += 1;
    console.log(`  ~ update ingredient #${existingId}: ${item.name}`);
    if (!dryRun) {
      const result = await client.query(
        `UPDATE ingredients
         SET name = $1, calories = $2, protein = $3, carbs = $4, fat = $5, unit = $6, is_staple = $7
         WHERE id = $8
         RETURNING id, name, calories, protein, carbs, fat, unit, is_staple`,
        [...payload, existingId]
      );
      const row = result.rows[0] as IngredientRow;
      // Drop stale name key if renamed
      for (const [key, value] of byName.entries()) {
        if (value.id === existingId) byName.delete(key);
      }
      byId.set(Number(row.id), row);
      byName.set(normalizeName(row.name), row);
    }
  }

  return stats;
}

async function setMealIngredients(
  client: PoolClient,
  mealId: number,
  links: Array<{ ingredientId: number; quantity: number }>
) {
  await client.query('DELETE FROM meal_combo_ingredients WHERE meal_combo_id = $1', [mealId]);

  for (const link of links) {
    await client.query(
      `INSERT INTO meal_combo_ingredients (meal_combo_id, ingredient_id, quantity)
       VALUES ($1, $2, $3)`,
      [mealId, link.ingredientId, link.quantity]
    );
  }

  // Recalculate macros explicitly so DELETE-trigger NEW-null issues can't leave stale totals
  if (links.length > 0) {
    await client.query(
      `UPDATE meal_combos mc
       SET
         calories = sub.calories,
         protein = sub.protein,
         carbs = sub.carbs,
         fat = sub.fat
       FROM (
         SELECT
           COALESCE(SUM(i.calories * mci.quantity), 0)::int AS calories,
           COALESCE(SUM(i.protein * mci.quantity), 0) AS protein,
           COALESCE(SUM(i.carbs * mci.quantity), 0) AS carbs,
           COALESCE(SUM(i.fat * mci.quantity), 0) AS fat
         FROM meal_combo_ingredients mci
         JOIN ingredients i ON i.id = mci.ingredient_id
         WHERE mci.meal_combo_id = $1
       ) sub
       WHERE mc.id = $1`,
      [mealId]
    );
  }
}

async function importMeals(client: PoolClient, items: CatalogMeal[], dryRun: boolean) {
  const stats = { created: 0, updated: 0, unchanged: 0, skipped: 0 };
  const ingredientMaps = await loadIngredientMaps(client);
  const mealMaps = await loadMealMaps(client);

  for (const item of items) {
    const links: Array<{ ingredientId: number; quantity: number }> = [];

    if (item.meal_type === 'composed') {
      const consolidated = new Map<number, { ingredientId: number; quantity: number }>();
      let missing = false;

      for (const ing of item.ingredients ?? []) {
        const found = ingredientMaps.byName.get(normalizeName(ing.name));
        if (!found) {
          console.error(`  ! meal "${item.name}" references unknown ingredient "${ing.name}" — skip`);
          missing = true;
          break;
        }
        const existing = consolidated.get(found.id);
        if (existing) {
          existing.quantity += ing.quantity;
        } else {
          consolidated.set(found.id, { ingredientId: found.id, quantity: ing.quantity });
        }
      }

      if (missing) {
        stats.skipped += 1;
        continue;
      }
      links.push(...consolidated.values());
    }

    const existingId = resolveByIdOrName(item.id, item.name, mealMaps.byId, mealMaps.byName);
    const macros = {
      calories: item.calories ?? 0,
      protein: item.protein ?? 0,
      carbs: item.carbs ?? 0,
      fat: item.fat ?? 0,
    };

    if (existingId == null) {
      stats.created += 1;
      console.log(`  + create meal: ${item.name} (${item.meal_type})`);
      if (!dryRun) {
        const result = await client.query(
          `INSERT INTO meal_combos (name, meal_type, calories, protein, carbs, fat, notes, instructions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, name`,
          [
            item.name,
            item.meal_type,
            macros.calories,
            macros.protein,
            macros.carbs,
            macros.fat,
            item.notes ?? null,
            item.instructions ?? null,
          ]
        );
        const row = result.rows[0] as { id: number; name: string };
        mealMaps.byId.set(Number(row.id), row);
        mealMaps.byName.set(normalizeName(row.name), row);

        if (item.meal_type === 'composed') {
          await setMealIngredients(client, Number(row.id), links);
        }
      }
      continue;
    }

    const currentResult = await client.query(
      `SELECT id, name, meal_type, calories, protein, carbs, fat, notes, instructions
       FROM meal_combos WHERE id = $1`,
      [existingId]
    );
    const currentMeal = currentResult.rows[0] as MealRow;

    const currentLinksResult = await client.query(
      `SELECT mci.ingredient_id, mci.quantity
       FROM meal_combo_ingredients mci
       WHERE mci.meal_combo_id = $1`,
      [existingId]
    );
    const currentLinks = currentLinksResult.rows as Array<{ ingredient_id: number; quantity: number }>;

    const desiredLinkKey = links
      .map((l) => `${l.ingredientId}:${Number(l.quantity)}`)
      .sort()
      .join('|');
    const currentLinkKey = currentLinks
      .map((l) => `${Number(l.ingredient_id)}:${Number(l.quantity)}`)
      .sort()
      .join('|');

    const same =
      String(currentMeal.name) === item.name &&
      String(currentMeal.meal_type) === item.meal_type &&
      String(currentMeal.notes ?? '') === String(item.notes ?? '') &&
      String(currentMeal.instructions ?? '') === String(item.instructions ?? '') &&
      (item.meal_type === 'composed'
        ? desiredLinkKey === currentLinkKey
        : Number(currentMeal.calories) === macros.calories &&
          Number(currentMeal.protein) === macros.protein &&
          Number(currentMeal.carbs) === macros.carbs &&
          Number(currentMeal.fat) === macros.fat &&
          currentLinks.length === 0);

    if (same) {
      stats.unchanged += 1;
      continue;
    }

    stats.updated += 1;
    console.log(`  ~ update meal #${existingId}: ${item.name}`);
    if (!dryRun) {
      await client.query(
        `UPDATE meal_combos
         SET name = $1,
             meal_type = $2,
             calories = $3,
             protein = $4,
             carbs = $5,
             fat = $6,
             notes = $7,
             instructions = $8
         WHERE id = $9`,
        [
          item.name,
          item.meal_type,
          macros.calories,
          macros.protein,
          macros.carbs,
          macros.fat,
          item.notes ?? null,
          item.instructions ?? null,
          existingId,
        ]
      );

      for (const [key, value] of mealMaps.byName.entries()) {
        if (value.id === existingId) mealMaps.byName.delete(key);
      }
      mealMaps.byId.set(existingId, { id: existingId, name: item.name });
      mealMaps.byName.set(normalizeName(item.name), { id: existingId, name: item.name });

      if (item.meal_type === 'composed') {
        await setMealIngredients(client, existingId, links);
      } else {
        await client.query('DELETE FROM meal_combo_ingredients WHERE meal_combo_id = $1', [existingId]);
      }
    }
  }

  return stats;
}

async function importCatalog() {
  const options = parseArgs(process.argv.slice(2));

  if (options.ingredientsOnly && options.mealsOnly) {
    throw new Error('Use only one of --ingredients-only or --meals-only');
  }

  console.log(
    options.dryRun
      ? 'Dry run — no database writes will be made.'
      : 'Importing catalog into the database...'
  );

  const client = await pool.connect();
  try {
    if (!options.dryRun) {
      await client.query('BEGIN');
    }

    if (!options.mealsOnly) {
      const ingredientsFile = readJson<IngredientsFile>(INGREDIENTS_PATH);
      if (!Array.isArray(ingredientsFile.ingredients)) {
        throw new Error('ingredients.json must contain an ingredients array');
      }
      const ingredients = ingredientsFile.ingredients.map(validateIngredient);
      console.log(`\nIngredients (${ingredients.length}):`);
      const stats = await importIngredients(client, ingredients, options.dryRun);
      console.log(
        `  → created ${stats.created}, updated ${stats.updated}, unchanged ${stats.unchanged}`
      );
    }

    if (!options.ingredientsOnly) {
      const mealsFile = readJson<MealsFile>(MEALS_PATH);
      if (!Array.isArray(mealsFile.meals)) {
        throw new Error('meals.json must contain a meals array');
      }
      const meals = mealsFile.meals.map(validateMeal);
      console.log(`\nMeals (${meals.length}):`);
      const stats = await importMeals(client, meals, options.dryRun);
      console.log(
        `  → created ${stats.created}, updated ${stats.updated}, unchanged ${stats.unchanged}, skipped ${stats.skipped}`
      );
      if (stats.skipped > 0) {
        throw new Error(`${stats.skipped} meal(s) skipped due to missing ingredients`);
      }
    }

    if (!options.dryRun) {
      await client.query('COMMIT');
    }

    console.log(options.dryRun ? '\nDry run complete.' : '\nImport complete.');
  } catch (error) {
    if (!options.dryRun) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback errors
      }
    }
    throw error;
  } finally {
    client.release();
    // client.ts opens an unreleased test connection; force-exit after a short end attempt
    await Promise.race([
      pool.end().catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
  }
}

importCatalog()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
