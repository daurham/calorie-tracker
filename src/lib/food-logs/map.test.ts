import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPortionToMeal,
  foodLogToLoggedMeal,
  inferLogProvenance,
  loggedMealToFoodLogInput,
} from './map';
import type { FoodLog } from '../../types/food-log';
import type { LoggedMeal } from '../utils';

const fruitSalad = {
  id: 10,
  name: 'Fruit Salad',
  meal_type: 'composed',
  calories: 180,
  protein: 0.9,
  carbs: 48,
  fat: 0.4,
  ingredients: [{ id: 1, name: 'Apple', quantity: 1 }],
  portion: 1,
  uniqueMealId: 99,
  timestamp: '10:00:00 AM',
} as LoggedMeal;

describe('food log mapping', () => {
  it('snapshots current calories instead of keeping a live catalog link', () => {
    const input = loggedMealToFoodLogInput(fruitSalad);
    assert.equal(input.calories, 180);
    assert.equal(input.source_type, 'meal_combo');
    assert.equal(input.nutrition_source, 'catalog');
    assert.equal(input.source_id, 10);
    assert.equal(input.metadata?.sourceMealId, 10);
  });

  it('marks migrated localStorage meals as legacy nutrition', () => {
    const input = loggedMealToFoodLogInput(fruitSalad, { migrated: true });
    assert.equal(input.nutrition_source, 'legacy');
    assert.equal(input.confidence, null);
    assert.equal(input.serving_description, null);
  });

  it('does not invent provenance for unknown macros or confidence', () => {
    const input = loggedMealToFoodLogInput({
      ...fruitSalad,
      protein: null,
      carbs: null,
      fat: null,
    } as LoggedMeal);
    assert.equal(input.protein, null);
    assert.equal(input.carbs, null);
    assert.equal(input.fat, null);
    assert.equal(input.confidence, null);
  });

  it('applies portion once when logging a catalog meal', () => {
    const adjusted = applyPortionToMeal({ ...fruitSalad, portion: 2 });
    assert.equal(adjusted.calories, 360);
    const input = loggedMealToFoodLogInput(adjusted);
    assert.equal(input.calories, 360);
    assert.equal(input.quantity, 2);
  });

  it('round-trips a food log back to the Today UI shape without changing calories', () => {
    const created: FoodLog = {
      id: 44,
      logged_at: '2026-09-20T17:00:00.000Z',
      group_id: null,
      display_name: 'Fruit Salad',
      source_type: 'meal_combo',
      source_id: 10,
      nutrition_source: 'catalog',
      quantity: 1,
      serving_description: null,
      weight_grams: null,
      calories: 180,
      protein: 0.9,
      carbs: 48,
      fat: 0.4,
      confidence: null,
      calorie_low: null,
      calorie_high: null,
      original_input: 'Fruit Salad',
      metadata: {
        sourceMealId: 10,
        portion: 1,
        mealType: 'composed',
        ingredients: fruitSalad.ingredients,
      },
      created_at: '2026-09-20T17:00:00.000Z',
      updated_at: '2026-09-20T17:00:00.000Z',
    };

    const laterCatalogCalories = 200;
    const uiMeal = foodLogToLoggedMeal(created);
    assert.equal(uiMeal.calories, 180);
    assert.notEqual(uiMeal.calories, laterCatalogCalories);
    assert.equal(uiMeal.foodLogId, 44);
    assert.equal(uiMeal.uniqueMealId, 44);
  });

  it('keeps a logged Fruit Salad snapshot when catalog Apple calories change', () => {
    const logged = loggedMealToFoodLogInput(fruitSalad);
    const updatedCatalog = {
      ...fruitSalad,
      calories: 280,
      ingredients: [{ id: 1, name: 'Apple', quantity: 1, calories: 195 }],
    } as LoggedMeal;
    const newlyLogged = loggedMealToFoodLogInput(updatedCatalog);

    assert.equal(logged.calories, 180);
    assert.equal(newlyLogged.calories, 280);
    assert.equal(foodLogToLoggedMeal({
      id: 44,
      logged_at: '2026-09-20T17:00:00.000Z',
      group_id: null,
      display_name: logged.display_name,
      source_type: logged.source_type,
      source_id: logged.source_id ?? null,
      nutrition_source: logged.nutrition_source,
      quantity: logged.quantity ?? 1,
      serving_description: null,
      weight_grams: null,
      calories: logged.calories,
      protein: logged.protein ?? null,
      carbs: logged.carbs ?? null,
      fat: logged.fat ?? null,
      confidence: null,
      calorie_low: null,
      calorie_high: null,
      original_input: logged.original_input ?? null,
      metadata: logged.metadata || {},
      created_at: '2026-09-20T17:00:00.000Z',
      updated_at: '2026-09-20T17:00:00.000Z',
    }).calories, 180);
  });

  it('classifies AI mods separately from meal combos', () => {
    const provenance = inferLogProvenance({
      ...fruitSalad,
      meal_type: 'mod',
      modId: 'ai-food-recognition',
      modData: { modId: 'ai-food-recognition' },
    } as LoggedMeal);
    assert.equal(provenance.source_type, 'ai_estimate');
    assert.equal(provenance.nutrition_source, 'ai_estimate');
  });
});
