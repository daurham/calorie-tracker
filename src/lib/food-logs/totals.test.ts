import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sumFoodLogNutrition, sumNullableMacros } from './totals';

describe('food log totals', () => {
  it('keeps all-unknown macros as null instead of zero', () => {
    const totals = sumFoodLogNutrition([
      { calories: 450, protein: null, carbs: null, fat: null },
      { calories: 200, protein: null, carbs: null, fat: null },
    ]);
    assert.deepEqual(totals, {
      calories: 650,
      protein: null,
      carbs: null,
      fat: null,
    });
  });

  it('sums only known macros and ignores nulls', () => {
    assert.equal(sumNullableMacros([20, null, 5]), 25);
    assert.equal(sumNullableMacros([null, null]), null);
  });
});
