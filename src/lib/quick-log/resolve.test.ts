import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { NutritionProvider } from '../../types/nutrition-provider';
import { ProviderError } from '../../types/nutrition-provider';
import type { RawSearchRecord } from '../../types/food-search';
import { searchLocalKnowledge } from '../food-search/search';
import {
  applyParsedQuantityToCandidate,
  calculateFromPer100g,
  ouncesToGrams,
} from '../nutrition-providers/math';
import { classifyUsdaRanking, rankUsdaCandidates } from '../nutrition-providers/usda/rank';
import {
  usdaBanana,
  usdaBananaBread,
  usdaBrandedBananaYogurt,
  usdaChickenFried,
  usdaChickenGrilled,
  usdaIncomplete,
  usdaRiceCooked,
  usdaRiceDry,
  usdaStrawberries,
} from '../nutrition-providers/usda/fixtures';
import { parseQuantityQuery } from './quantity';
import { referenceCandidateToFoodLogInput } from './reference-log';
import { resolveQuickLog } from './resolve';

const local = (name: string, extras: Partial<RawSearchRecord> = {}): RawSearchRecord => ({
  id: extras.id ?? name,
  entityType: extras.entityType ?? 'meal_combo',
  name,
  calories: extras.calories ?? 300,
  protein: extras.protein ?? 10,
  carbs: extras.carbs ?? 30,
  fat: extras.fat ?? 10,
  usageCount: extras.usageCount ?? 0,
  lastUsedAt: extras.lastUsedAt ?? null,
  servingDescription: extras.servingDescription ?? '1 serving',
  ...extras,
});

class MockUsda implements NutritionProvider {
  searchCalls = 0;
  constructor(private results: NutritionProvider extends { search: infer T } ? any : never, private error?: ProviderError) {}
  async search() {
    this.searchCalls += 1;
    if (this.error) throw this.error;
    return this.results;
  }
  async getFood(id: string) {
    const found = this.results.find((item: any) => item.externalId === id);
    if (!found) throw new ProviderError('provider_error', 'not found');
    return { ...found, nutrition: null, selectedPortion: null, weightGrams: null, quantity: 1, servingDescription: null, portionResolved: false, confidence: 'low' as const };
  }
}

describe('reference nutrition math', () => {
  it('calculates 100g strawberries deterministically', () => {
    const parsed = parseQuantityQuery('100g strawberries');
    const applied = applyParsedQuantityToCandidate(usdaStrawberries, parsed);
    assert.equal(applied.portionResolved, true);
    assert.equal(applied.weightGrams, 100);
    assert.equal(applied.nutrition?.calories, 32);
    assert.equal(applied.nutrition?.protein, 0.7);
  });

  it('converts 6 oz chicken breast to grams and scales per 100g', () => {
    const grams = ouncesToGrams(6);
    assert.ok(Math.abs(grams - 170.097) < 0.01);
    const nutrition = calculateFromPer100g(usdaChickenGrilled.nutritionPer100g, grams);
    assert.equal(nutrition?.calories, Math.round(165 * (grams / 100)));
    assert.equal(nutrition?.protein, Number((31 * (grams / 100)).toFixed(1)));
  });

  it('uses a banana household portion only when gram weight is known', () => {
    const applied = applyParsedQuantityToCandidate(usdaBanana, parseQuantityQuery('1 banana'));
    assert.equal(applied.portionResolved, true);
    assert.equal(applied.weightGrams, 118);
    assert.equal(applied.nutrition?.calories, Math.round(89 * 1.18));
  });

  it('does not invent a bowl weight for rice', () => {
    const applied = applyParsedQuantityToCandidate(usdaRiceCooked, parseQuantityQuery('1 bowl rice'));
    assert.equal(applied.portionResolved, false);
    assert.equal(applied.weightGrams, null);
    assert.equal(applied.nutrition, null);
  });

  it('keeps incomplete macros null after calculation', () => {
    const nutrition = calculateFromPer100g(usdaIncomplete.nutritionPer100g, 200);
    assert.equal(nutrition?.calories, 100);
    assert.equal(nutrition?.protein, null);
    assert.equal(nutrition?.carbs, null);
    assert.equal(nutrition?.fat, null);
  });
});

describe('USDA ranking', () => {
  it('prefers cooked rice over dry rice for a cooked query', () => {
    const ranked = rankUsdaCandidates('white rice cooked', [usdaRiceDry, usdaRiceCooked]);
    assert.equal(ranked[0].candidate.name, usdaRiceCooked.name);
    assert.ok(ranked[0].score > ranked[1].score);
    assert.ok(ranked[1].conflicts.includes('preparation'));
  });

  it('prefers grilled chicken over fried chicken', () => {
    const ranked = rankUsdaCandidates('grilled chicken breast', [usdaChickenFried, usdaChickenGrilled]);
    assert.equal(ranked[0].candidate.name, usdaChickenGrilled.name);
    assert.ok(ranked[1].conflicts.includes('preparation'));
    assert.notEqual(ranked[1].matchType, 'exact');
    assert.notEqual(ranked[1].matchType, 'strong');
  });

  it('does not treat a conflicting banana product as reliable', () => {
    const ranked = rankUsdaCandidates('banana', [usdaBananaBread, usdaBrandedBananaYogurt, usdaBanana]);
    assert.equal(ranked[0].candidate.name, usdaBanana.name);
    assert.ok(['exact', 'strong'].includes(classifyUsdaRanking(ranked)));
    const bread = ranked.find(item => item.candidate.name === usdaBananaBread.name);
    assert.ok(bread);
    assert.ok(bread.matchType === 'weak' || bread.matchType === 'none');
  });
});

describe('quick log resolver', () => {
  it('resolves 6 oz chicken breast with deterministic USDA grams', async () => {
    const usda = new MockUsda([usdaChickenGrilled, usdaChickenFried]);
    const result = await resolveQuickLog(
      { input: { type: 'text', text: '6 oz chicken breast' } },
      { searchLocal: () => ({ query: 'chicken breast', classification: 'none', results: [] }), provider: usda }
    );
    assert.equal(result.status, 'reference');
    if (result.status !== 'reference') return;
    const grams = ouncesToGrams(6);
    assert.equal(result.results[0].weightGrams, Number(grams.toFixed(2)));
    assert.equal(result.results[0].nutrition?.calories, Math.round(165 * (grams / 100)));
  });

  it('uses USDA when banana has no personal match', async () => {
    const usda = new MockUsda([usdaBanana, usdaBananaBread]);
    const result = await resolveQuickLog(
      { input: { type: 'text', text: 'banana' } },
      { searchLocal: (query) => searchLocalKnowledge(query, []), provider: usda }
    );
    assert.equal(result.status, 'reference');
    assert.equal(result.usedUsda, true);
    assert.equal(usda.searchCalls, 1);
    if (result.status === 'reference') {
      assert.equal(result.results[0].name, 'Bananas, raw');
    }
  });

  it('creates a USDA food_log snapshot without a canonical food', async () => {
    const usda = new MockUsda([usdaBanana]);
    const result = await resolveQuickLog(
      { input: { type: 'text', text: 'banana' } },
      { searchLocal: () => ({ query: 'banana', classification: 'none', results: [] }), provider: usda }
    );
    assert.equal(result.status, 'reference');
    if (result.status !== 'reference') return;
    const input = referenceCandidateToFoodLogInput(result.results[0], 'banana');
    assert.equal(input.source_type, 'usda');
    assert.equal(input.nutrition_source, 'usda');
    assert.equal(input.metadata?.provider, 'usda');
    assert.equal(input.metadata?.externalId, '173944');
    assert.equal(input.calories, result.results[0].nutrition?.calories);
  });

  it('reuses a previously accepted banana from history without USDA', async () => {
    const usda = new MockUsda([usdaBanana]);
    const history = local('Bananas, raw', {
      entityType: 'historical_log',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      usageCount: 1,
    });
    const result = await resolveQuickLog(
      { input: { type: 'text', text: 'banana' } },
      { searchLocal: (query) => searchLocalKnowledge(query, [history]), provider: usda }
    );
    assert.equal(result.status, 'local');
    assert.equal(result.usedUsda, false);
    assert.equal(usda.searchCalls, 0);
    if (result.status === 'local') {
      assert.equal(result.results[0].name, 'Bananas, raw');
    }
  });

  it('lets personal chicken breast win without calling USDA', async () => {
    const usda = new MockUsda([usdaChickenGrilled]);
    const result = await resolveQuickLog(
      { input: { type: 'text', text: 'chicken breast' } },
      {
        searchLocal: (query) => searchLocalKnowledge(query, [local('Chicken Breast', { calories: 180 })]),
        provider: usda,
      }
    );
    assert.equal(result.status, 'local');
    assert.equal(result.usedUsda, false);
    assert.equal(usda.searchCalls, 0);
  });

  it('returns personal tamale ambiguity instead of asking USDA', async () => {
    const usda = new MockUsda([usdaBanana]);
    const result = await resolveQuickLog(
      { input: { type: 'text', text: 'tamale' } },
      {
        searchLocal: (query) => searchLocalKnowledge(query, [
          local('Pork Tamale', { usageCount: 11 }),
          local('Chicken Tamale', { usageCount: 4 }),
        ]),
        provider: usda,
      }
    );
    assert.equal(result.status, 'local');
    assert.equal(result.classification, 'ambiguous');
    assert.equal(result.usedUsda, false);
    assert.equal(usda.searchCalls, 0);
  });

  it('returns a recoverable state when USDA times out', async () => {
    const usda = new MockUsda([], new ProviderError('timeout', 'USDA request timed out'));
    const result = await resolveQuickLog(
      { input: { type: 'text', text: 'banana' } },
      { searchLocal: () => ({ query: 'banana', classification: 'none', results: [] }), provider: usda }
    );
    assert.equal(result.status, 'unresolved');
    assert.equal(result.usedUsda, true);
    if (result.status === 'unresolved') {
      assert.equal(result.error, 'timeout');
      assert.equal(result.message, "Couldn't search reference nutrition.");
    }
  });

  it('does not classify a highly conflicting USDA candidate as reliable', async () => {
    const usda = new MockUsda([usdaChickenFried]);
    const result = await resolveQuickLog(
      { input: { type: 'text', text: 'grilled chicken breast' } },
      { searchLocal: () => ({ query: 'grilled chicken breast', classification: 'none', results: [] }), provider: usda }
    );
    if (result.status === 'reference') {
      assert.notEqual(result.classification, 'exact');
      assert.ok(result.results[0].match.conflicts.includes('preparation'));
    } else {
      assert.equal(result.status, 'unresolved');
    }
  });
});
