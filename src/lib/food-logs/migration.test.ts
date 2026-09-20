import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMigratedFoodLogInputs } from './migration';
import type { LoggedMeal } from '../utils';

describe('localStorage migration mapping', () => {
  it('preserves known snapshot calories and does not invent serving data', () => {
    const inputs = buildMigratedFoodLogInputs([
      {
        id: 10,
        name: 'Fruit Salad',
        meal_type: 'composed',
        calories: 180,
        protein: 0.9,
        carbs: 48,
        fat: 0.4,
        ingredients: [{ id: 1, name: 'Apple', quantity: 1 }],
        uniqueMealId: 99,
        portion: 1,
        timestamp: '10:00:00 AM',
      } as LoggedMeal,
    ]);

    assert.equal(inputs.length, 1);
    assert.equal(inputs[0].calories, 180);
    assert.equal(inputs[0].nutrition_source, 'legacy');
    assert.equal(inputs[0].confidence, null);
    assert.equal(inputs[0].serving_description, null);
    assert.equal(inputs[0].calorie_low, null);
    assert.equal(inputs[0].weight_grams, null);
  });
});
