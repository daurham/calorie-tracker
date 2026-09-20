import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUsdaFood, normalizeUsdaSearchResults } from './normalize';
import { usdaIncomplete } from './fixtures';

describe('USDA normalization', () => {
  it('keeps missing macros null instead of zero', () => {
    const candidate = normalizeUsdaFood({
      fdcId: 1,
      description: 'Mystery fruit',
      dataType: 'SR Legacy',
      foodNutrients: [{ nutrientId: 1008, nutrientName: 'Energy', value: 50, unitName: 'KCAL' }],
    });
    assert.equal(candidate?.nutritionPer100g.calories, 50);
    assert.equal(candidate?.nutritionPer100g.protein, null);
    assert.equal(candidate?.nutritionPer100g.carbs, null);
    assert.equal(candidate?.nutritionPer100g.fat, null);
    assert.equal(usdaIncomplete.nutritionPer100g.protein, null);
  });

  it('ignores malformed search payloads', () => {
    assert.deepEqual(normalizeUsdaSearchResults({ foods: [{ fdcId: 2 }] }), []);
  });
});
