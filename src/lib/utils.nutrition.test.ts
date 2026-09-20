import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPortionToTotals,
  calculateComposedMealTotals,
  mapComboMealsWithIngredients,
  reconcileLoggedMeals,
  sumLoggedMealTotals,
  type LoggedMeal,
} from './utils';
import type { Ingredient, Meal, MealCombo } from '../types';

const apple = {
  id: 1,
  name: 'Apple',
  calories: 80,
  protein: 0.3,
  carbs: 21,
  fat: 0.2,
  serving_size: 1,
  serving_unit: 'medium',
  unit: 'medium',
  quantity: 1,
} as Ingredient;

const pear = {
  id: 2,
  name: 'Pear',
  calories: 100,
  protein: 0.6,
  carbs: 27,
  fat: 0.2,
  serving_size: 1,
  serving_unit: 'medium',
  unit: 'medium',
  quantity: 1,
} as Ingredient;

const fruitSalad = {
  id: 10,
  name: 'Fruit Salad',
  meal_type: 'composed',
  calories: 180,
  protein: 0.9,
  carbs: 48,
  fat: 0.4,
  ingredients: [
    { id: 1, name: 'Apple', quantity: 1 },
    { id: 2, name: 'Pear', quantity: 1 },
  ],
} as MealCombo;

describe('catalog meal recalculation', () => {
  it('recomputes composed meal totals from current ingredients', () => {
    const before = mapComboMealsWithIngredients([fruitSalad], [apple, pear])[0];
    assert.equal(before.calories, 180);

    const after = mapComboMealsWithIngredients(
      [fruitSalad],
      [{ ...apple, calories: 100 }, pear]
    )[0];
    assert.equal(after.calories, 200);
    assert.equal((after.ingredients[0] as Ingredient).calories, 100);
  });

  it('does not recompute standalone meal totals from ingredients', () => {
    const standalone = {
      ...fruitSalad,
      meal_type: 'standalone',
      calories: 450,
      protein: 10,
      carbs: 40,
      fat: 20,
    } as MealCombo;

    const mapped = mapComboMealsWithIngredients(
      [standalone],
      [{ ...apple, calories: 999 }, pear]
    )[0];

    assert.equal(mapped.calories, 450);
    assert.equal(mapped.protein, 10);
  });

  it('scales portion against a snapshot, not a later catalog change', () => {
    const totals = calculateComposedMealTotals([
      { ...apple, quantity: 1 },
      { ...pear, quantity: 1 },
    ]);
    assert.deepEqual(applyPortionToTotals(totals, 2), {
      calories: 360,
      protein: 1.8,
      carbs: 96,
      fat: 0.8,
    });
  });
});

describe('logged meal reconcile (pre-food-log helper)', () => {
  it('refreshes unedited logged meals from the current catalog', () => {
    const logged = [{
      ...mapComboMealsWithIngredients([fruitSalad], [apple, pear])[0],
      uniqueMealId: 99,
      timestamp: '10:00:00 AM',
      isEdited: false,
      portion: 1,
    }] as LoggedMeal[];
    const updatedCatalog = mapComboMealsWithIngredients(
      [fruitSalad],
      [{ ...apple, calories: 100 }, pear]
    ) as Meal[];

    const reconciled = reconcileLoggedMeals(logged, updatedCatalog)[0];
    assert.equal(reconciled.calories, 200);
    assert.equal(reconciled.ingredients[0].calories, 100);
  });

  it('keeps manually edited logged meals at their snapshot calories', () => {
    const logged = [{
      ...mapComboMealsWithIngredients([fruitSalad], [apple, pear])[0],
      uniqueMealId: 99,
      isEdited: true,
      portion: 1,
      calories: 180,
    }] as LoggedMeal[];
    const updatedCatalog = mapComboMealsWithIngredients(
      [fruitSalad],
      [{ ...apple, calories: 100 }, pear]
    ) as Meal[];

    const reconciled = reconcileLoggedMeals(logged, updatedCatalog)[0];
    assert.equal(reconciled.calories, 180);
    assert.equal(reconciled.isEdited, true);
  });
});

describe('sumLoggedMealTotals', () => {
  it('adds calories and macros from logged meals', () => {
    assert.deepEqual(
      sumLoggedMealTotals([
        { calories: 180, protein: 0.9, carbs: 48, fat: 0.4 },
        { calories: 200, protein: 1.1, carbs: 20, fat: 2 },
      ]),
      { calories: 380, protein: 2, carbs: 68, fat: 2.4 }
    );
  });
});
