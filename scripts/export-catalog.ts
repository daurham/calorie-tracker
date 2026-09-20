import { getRows } from '../src/lib/db/client';
import {
  CATALOG_VERSION,
  INGREDIENTS_PATH,
  MEALS_PATH,
  writeJson,
  type CatalogIngredient,
  type CatalogMeal,
  type IngredientsFile,
  type MealsFile,
} from './lib/catalog';

async function exportCatalog() {
  const ingredientRows = await getRows(
    `SELECT id, name, calories, protein, carbs, fat, unit, is_staple
     FROM ingredients
     ORDER BY name`
  );

  const mealRows = await getRows(`
    SELECT
      m.id,
      m.name,
      m.meal_type,
      m.calories,
      m.protein,
      m.carbs,
      m.fat,
      m.notes,
      m.instructions,
      COALESCE(
        json_agg(
          json_build_object(
            'name', i.name,
            'quantity', mi.quantity
          )
          ORDER BY i.name
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) AS ingredients
    FROM meal_combos m
    LEFT JOIN meal_combo_ingredients mi ON m.id = mi.meal_combo_id
    LEFT JOIN ingredients i ON mi.ingredient_id = i.id
    GROUP BY m.id
    ORDER BY m.name
  `);

  const exportedAt = new Date().toISOString();

  const ingredients: CatalogIngredient[] = ingredientRows.map((row) => ({
    id: Number(row.id),
    name: String(row.name).trim(),
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    unit: String(row.unit).trim(),
    is_staple: Boolean(row.is_staple),
  }));

  const meals: CatalogMeal[] = mealRows.map((row) => {
    const mealType = row.meal_type === 'standalone' ? 'standalone' : 'composed';
    const mealIngredients = Array.isArray(row.ingredients) ? row.ingredients : [];

    const meal: CatalogMeal = {
      id: Number(row.id),
      name: String(row.name).trim(),
      meal_type: mealType,
      calories: Number(row.calories),
      protein: Number(row.protein),
      carbs: Number(row.carbs),
      fat: Number(row.fat),
      notes: row.notes ? String(row.notes) : null,
      instructions: row.instructions ? String(row.instructions) : null,
    };

    if (mealType === 'composed') {
      meal.ingredients = mealIngredients.map((ing: { name: string; quantity: number | string }) => ({
        name: String(ing.name).trim(),
        quantity: Number(ing.quantity),
      }));
    } else {
      meal.ingredients = [];
    }

    return meal;
  });

  const ingredientsFile: IngredientsFile = {
    version: CATALOG_VERSION,
    exportedAt,
    ingredients,
  };

  const mealsFile: MealsFile = {
    version: CATALOG_VERSION,
    exportedAt,
    meals,
  };

  writeJson(INGREDIENTS_PATH, ingredientsFile);
  writeJson(MEALS_PATH, mealsFile);

  console.log(`Exported ${ingredients.length} ingredients → ${INGREDIENTS_PATH}`);
  console.log(`Exported ${meals.length} meals → ${MEALS_PATH}`);
}

exportCatalog()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Export failed:', error);
    process.exit(1);
  });
