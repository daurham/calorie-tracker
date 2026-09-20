import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderError } from '../../types/nutrition-provider';
import type { NutritionProvider } from '../../types/nutrition-provider';
import type { FoodAIProvider, ImageInput } from '../../types/nutrition-label';
import type { FoodInterpretation } from '../../types/food-interpretation';
import type { RawSearchRecord } from '../../types/food-search';
import { MemoryAiStore } from '../ai-infra/store';
import { searchLocalKnowledge } from '../food-search/search';
import {
  usdaBanana,
  usdaChickenGrilled,
  usdaKimchi,
  usdaRiceCooked,
  usdaStrawberries,
  usdaTamale,
} from '../nutrition-providers/usda/fixtures';
import { shouldPersistFoodPhoto } from '../packaged-foods/image';
import { estimateFood } from './estimate';
import { createsCanonicalFoodFromEstimate, draftToCreateRequest } from './log';
import { resolveInterpretation } from './resolve-interpretation';
import { draftTotals, scaleEstimateItem } from './scale-draft';
import { formatApproxCalories, validateAiNutrition } from './validate';

const localRecord = (name: string, extras: Partial<RawSearchRecord> = {}): RawSearchRecord => ({
  id: extras.id ?? name,
  entityType: extras.entityType ?? 'food',
  name,
  calories: extras.calories ?? 300,
  protein: extras.protein ?? 10,
  carbs: extras.carbs ?? 30,
  fat: extras.fat ?? 10,
  usageCount: extras.usageCount ?? 3,
  lastUsedAt: extras.lastUsedAt ?? '2026-09-01T00:00:00.000Z',
  servingDescription: extras.servingDescription ?? '1 serving',
  ...extras,
});

class MockUsda implements NutritionProvider {
  searchCalls = 0;
  queries: string[] = [];
  constructor(private resolveQuery: (query: string) => any[] = () => []) {}
  async search(query: string) {
    this.searchCalls += 1;
    this.queries.push(query);
    return this.resolveQuery(query);
  }
  async getFood(): Promise<import('../../types/nutrition-provider').NutritionReference> {
    throw new ProviderError('provider_error', 'unused');
  }
}

class MockFoodAI implements FoodAIProvider {
  parseCalls = 0;
  imageCalls = 0;
  lastText: string | null = null;
  lastContext: string | undefined;
  lastImage: ImageInput | null = null;
  constructor(private result: FoodInterpretation | Error | ((input: string) => FoodInterpretation)) {}
  async extractNutritionLabel(): Promise<import('../../types/nutrition-label').NutritionLabelResult> {
    throw new Error('label extraction is out of scope for estimate tests');
  }
  async parseFoodDescription(input: string) {
    this.parseCalls += 1;
    this.lastText = input;
    if (this.result instanceof Error) throw this.result;
    return typeof this.result === 'function' ? this.result(input) : this.result;
  }
  async analyzeFoodImage(image: ImageInput, context?: string) {
    this.imageCalls += 1;
    this.lastImage = image;
    this.lastContext = context;
    if (this.result instanceof Error) throw this.result;
    return typeof this.result === 'function' ? this.result(context || '') : this.result;
  }
}

const tamaleInterpretation: FoodInterpretation = {
  displayName: 'Homemade Pork Tamale',
  portion: { description: '1 medium tamale', estimatedWeightGrams: 115 },
  components: [{
    name: 'pork tamale',
    quantityDescription: '1 medium',
    estimatedWeightGrams: 115,
    attributes: { filling: 'pork', preparation: 'traditional' },
  }],
  assumptions: ['corn masa', 'pork filling', 'moderate added fat'],
  confidence: 'medium',
  fallbackNutrition: {
    calories: 310,
    protein: 12,
    carbs: 34,
    fat: 14,
    calorieLow: 250,
    calorieHigh: 380,
  },
};

const plateInterpretation = (includeKimchiUsdaName = true): FoodInterpretation => ({
  displayName: 'Chicken, Rice & Kimchi',
  portion: { description: 'one plate', estimatedWeightGrams: null },
  components: [
    { name: 'grilled chicken', quantityDescription: '6 oz', estimatedWeightGrams: null },
    { name: 'white rice', quantityDescription: '1 cup', estimatedWeightGrams: null },
    { name: includeKimchiUsdaName ? 'kimchi' : 'house kimchi', quantityDescription: 'little', estimatedWeightGrams: 40 },
  ],
  assumptions: ['grilled chicken breast', 'cooked white rice', 'small kimchi side'],
  confidence: 'medium',
  fallbackNutrition: {
    calories: 20,
    protein: 1,
    carbs: 3,
    fat: 0.5,
    calorieLow: 10,
    calorieHigh: 35,
  },
});

const photo = (fill = 9): ImageInput => ({
  mimeType: 'image/jpeg',
  dataBase64: Buffer.alloc(220, fill).toString('base64'),
});

const estimate = (
  input: Parameters<typeof estimateFood>[0],
  extras: {
    records?: RawSearchRecord[];
    usda?: MockUsda;
    foodAi?: MockFoodAI;
    store?: MemoryAiStore;
  } = {}
) => estimateFood(input, {
  searchLocal: (query) => searchLocalKnowledge(query, extras.records || []),
  provider: extras.usda || new MockUsda(),
  foodAi: extras.foodAi || new MockFoodAI(tamaleInterpretation),
  store: extras.store || new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 }),
});

describe('Phase 6B text resolution hierarchy', () => {
  it('1. known personal food does not call Gemini', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const usda = new MockUsda(() => [usdaBanana]);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const result = await estimate({ type: 'text', text: 'banana protein shake' }, {
      records: [localRecord('Banana Protein Shake', { calories: 240, protein: 28, carbs: 18, fat: 4 })],
      usda,
      foodAi,
      store,
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.usedGemini, false);
    assert.equal(result.draft.items[0].nutritionSource, 'catalog');
    assert.equal(foodAi.parseCalls, 0);
    assert.equal((await store.listUsage()).length, 0);
  });

  it('2. historical food does not call Gemini', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const result = await estimate({ type: 'text', text: 'protein shake' }, {
      records: [localRecord('Protein Shake', { entityType: 'historical_log', calories: 220 })],
      foodAi,
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.usedGemini, false);
    assert.equal(result.draft.items[0].sourceType, 'historical_log');
    assert.equal(foodAi.parseCalls, 0);
  });

  it('3. USDA-resolvable ordinary food does not call Gemini after reference resolution', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const result = await estimate({ type: 'text', text: '100g strawberries' }, {
      usda: new MockUsda(() => [usdaStrawberries]),
      foodAi,
      store,
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.usedGemini, false);
    assert.equal(result.draft.items[0].nutritionSource, 'usda');
    assert.equal(result.draft.items[0].nutrition.calories, 32);
    assert.equal(foodAi.parseCalls, 0);
    assert.equal((await store.listUsage()).length, 0);
  });

  it('4. explicit estimate of an unknown food calls Gemini through the shared gate', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const result = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, {
      foodAi,
      store,
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.usedGemini, true);
    assert.equal(result.draft.requestType, 'text_parse');
    assert.equal(foodAi.parseCalls, 1);
    const usage = await store.listUsage();
    assert.equal(usage.length, 1);
    assert.equal(usage[0].requestType, 'text_parse');
    assert.equal(usage[0].success, true);
  });

  it('5. medium homemade pork tamale returns structured interpretation', async () => {
    const result = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, {
      foodAi: new MockFoodAI(tamaleInterpretation),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.interpretation?.displayName, 'Homemade Pork Tamale');
    assert.equal(result.draft.interpretation?.portion.estimatedWeightGrams, 115);
    assert.equal(result.draft.interpretation?.components[0].attributes?.filling, 'pork');
    assert.ok(result.draft.assumptions.includes('corn masa'));
  });

  it('6. interpreted tamale plus usable USDA reference prefers deterministic nutrition', async () => {
    const result = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, {
      usda: new MockUsda((query) => /tamale/i.test(query) ? [usdaTamale] : []),
      foodAi: new MockFoodAI(tamaleInterpretation),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.items[0].nutritionSource, 'usda');
    assert.equal(result.draft.items[0].usedAiFallback, false);
    assert.equal(result.draft.items[0].weightGrams, 115);
    assert.equal(result.draft.items[0].nutrition.calories, Math.round(270 * 1.15));
    assert.equal(formatApproxCalories(result.draft.items[0].nutrition.calories, true), '≈310');
  });

  it('7. unusable reference uses AI fallback nutrition with a range', async () => {
    const result = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, {
      usda: new MockUsda(() => []),
      foodAi: new MockFoodAI(tamaleInterpretation),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    const item = result.draft.items[0];
    assert.equal(item.nutritionSource, 'ai_estimate');
    assert.equal(item.usedAiFallback, true);
    assert.notEqual(item.confidence, 'verified');
    assert.equal(item.calorieLow, 250);
    assert.equal(item.calorieHigh, 380);
    assert.equal(item.nutrition.calories, 310);
  });

  it('8. implausible AI macro/calorie mismatch is down-ranked or rejected', () => {
    const warned = validateAiNutrition({
      calories: 450,
      protein: 5,
      carbs: 8,
      fat: 4,
    });
    assert.equal(warned.ok, false);
    assert.equal(warned.rejected, true);
    assert.ok(warned.warnings[0]?.includes('differ a lot'));

    const plausibleHighFat = validateAiNutrition({
      calories: 450,
      protein: 10,
      carbs: 5,
      fat: 42,
    }, { weightGrams: 80 });
    assert.equal(plausibleHighFat.rejected, false);
  });

  it('9. accepted AI estimate becomes durable history, not a canonical food', async () => {
    const result = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, {
      foodAi: new MockFoodAI(tamaleInterpretation),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    const request = draftToCreateRequest(result.draft);
    assert.equal(request.logs.length, 1);
    assert.equal(request.logs[0].nutrition_source, 'ai_estimate');
    assert.equal(request.logs[0].calories, 310);
    assert.equal(createsCanonicalFoodFromEstimate(), false);
    assert.equal(request.logs[0].metadata?.persistedImage, false);
  });

  it('10. the same accepted food later resolves from history before Gemini', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const first = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, { foodAi });
    assert.equal(first.status, 'draft');
    if (first.status !== 'draft') return;
    const accepted = draftToCreateRequest(first.draft).logs[0];
    const later = await estimate({ type: 'text', text: 'homemade pork tamale' }, {
      records: [localRecord(accepted.display_name, {
        entityType: 'historical_log',
        calories: accepted.calories,
        protein: accepted.protein,
        carbs: accepted.carbs,
        fat: accepted.fat,
      })],
      foodAi,
    });
    assert.equal(later.status, 'draft');
    if (later.status !== 'draft') return;
    assert.equal(later.draft.usedGemini, false);
    assert.equal(later.draft.items[0].sourceType, 'historical_log');
    assert.equal(foodAi.parseCalls, 1);
  });

  it('11. an unaccepted AI draft creates no food_log and no canonical food', async () => {
    const result = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, {
      foodAi: new MockFoodAI(tamaleInterpretation),
    });
    assert.equal(result.status, 'draft');
    assert.equal(createsCanonicalFoodFromEstimate(), false);
    assert.equal('logs' in (result.status === 'draft' ? result.draft : {}), false);
  });

  it('12. quantity x2 after estimate scales deterministically without Gemini', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const result = await estimate({ type: 'text', text: 'medium homemade pork tamale' }, { foodAi });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    const doubled = scaleEstimateItem(result.draft.items[0], { quantity: 2 });
    assert.equal(doubled.nutrition.calories, 620);
    assert.equal(foodAi.parseCalls, 1);
    const heavier = scaleEstimateItem(result.draft.items[0], { weightGrams: 150 });
    assert.equal(heavier.nutrition.calories, Math.round(310 * (150 / 115)));
    assert.equal(foodAi.parseCalls, 1);
  });
});

describe('Phase 6B multi-food decomposition', () => {
  it('13. comma-separated plate text becomes structured components', async () => {
    const result = await estimate({
      type: 'text',
      text: '6 oz grilled chicken, 1 cup rice, little kimchi',
    }, {
      usda: new MockUsda((query) => {
        if (/chicken/i.test(query)) return [usdaChickenGrilled];
        if (/rice/i.test(query)) return [usdaRiceCooked];
        if (/kimchi/i.test(query)) return [usdaKimchi];
        return [];
      }),
      foodAi: new MockFoodAI(plateInterpretation()),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.items.length, 3);
    assert.ok(result.draft.items.some(item => /chicken/i.test(item.name)));
    assert.ok(result.draft.items.some(item => /rice/i.test(item.name)));
    assert.ok(result.draft.items.some(item => /kimchi/i.test(item.name)));
  });

  it('14. resolvable components use individual reference nutrition', async () => {
    const result = await estimate({
      type: 'text',
      text: '6 oz grilled chicken, 1 cup rice, little kimchi',
    }, {
      usda: new MockUsda((query) => {
        if (/chicken/i.test(query)) return [usdaChickenGrilled];
        if (/rice/i.test(query)) return [usdaRiceCooked];
        if (/kimchi/i.test(query)) return [usdaKimchi];
        return [];
      }),
      foodAi: new MockFoodAI(plateInterpretation()),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    const chicken = result.draft.items.find(item => /chicken/i.test(item.name));
    const rice = result.draft.items.find(item => /rice/i.test(item.name));
    const kimchi = result.draft.items.find(item => /kimchi/i.test(item.name));
    assert.equal(chicken?.nutritionSource, 'usda');
    assert.equal(rice?.nutritionSource, 'usda');
    assert.equal(kimchi?.nutritionSource, 'usda');
    assert.equal(chicken?.nutrition.calories, 281);
    assert.equal(rice?.nutrition.calories, 205);
    assert.equal(chicken?.usedAiFallback, false);
    assert.equal(rice?.usedAiFallback, false);
  });

  it('15. fallback applies only to the unresolved component', async () => {
    const result = await estimate({
      type: 'text',
      text: '6 oz grilled chicken, 1 cup rice, little kimchi',
    }, {
      usda: new MockUsda((query) => {
        if (/chicken/i.test(query)) return [usdaChickenGrilled];
        if (/rice/i.test(query)) return [usdaRiceCooked];
        return [];
      }),
      foodAi: new MockFoodAI(plateInterpretation(false)),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    const chicken = result.draft.items.find(item => /chicken/i.test(item.name));
    const rice = result.draft.items.find(item => /rice/i.test(item.name));
    const kimchi = result.draft.items.find(item => /kimchi/i.test(item.name));
    assert.equal(chicken?.nutritionSource, 'usda');
    assert.equal(rice?.nutritionSource, 'usda');
    assert.equal(kimchi?.nutritionSource, 'ai_estimate');
    assert.equal(kimchi?.nutrition.calories, 20);
  });

  it('16. Add All builds a transactional group plus component logs', async () => {
    const items = await resolveInterpretation(plateInterpretation(), {
      searchLocal: () => ({ query: '', classification: 'none', results: [] }),
      provider: new MockUsda((query) => {
        if (/chicken/i.test(query)) return [usdaChickenGrilled];
        if (/rice/i.test(query)) return [usdaRiceCooked];
        if (/kimchi/i.test(query)) return [usdaKimchi];
        return [];
      }),
    });
    const request = draftToCreateRequest({
      displayName: 'Chicken, Rice & Kimchi',
      items,
      assumptions: [],
      confidence: 'medium',
      usedGemini: true,
      cached: false,
      originalInput: '6 oz grilled chicken, 1 cup rice, little kimchi',
      interpretation: plateInterpretation(),
      requestType: 'text_parse',
    });
    assert.ok(request.group);
    assert.equal(request.logs.length, 3);
    assert.equal(request.group?.display_name, 'Chicken, Rice & Kimchi');
    assert.equal(new Set(request.logs.map(log => log.display_name)).size, 3);
  });

  it('17. editing rice quantity before Add recalculates only rice and the total', async () => {
    const items = await resolveInterpretation(plateInterpretation(), {
      searchLocal: () => ({ query: '', classification: 'none', results: [] }),
      provider: new MockUsda((query) => {
        if (/chicken/i.test(query)) return [usdaChickenGrilled];
        if (/rice/i.test(query)) return [usdaRiceCooked];
        if (/kimchi/i.test(query)) return [usdaKimchi];
        return [];
      }),
    });
    const rice = items.find(item => /rice/i.test(item.name));
    const chickenCalories = items.find(item => /chicken/i.test(item.name))?.nutrition.calories || 0;
    assert.ok(rice);
    const scaled = items.map(item => item.id === rice.id ? scaleEstimateItem(item, { quantity: 2 }) : item);
    const riceAfter = scaled.find(item => /rice/i.test(item.name));
    assert.equal(riceAfter?.nutrition.calories, (rice?.nutrition.calories || 0) * 2);
    assert.equal(scaled.find(item => /chicken/i.test(item.name))?.nutrition.calories, chickenCalories);
    assert.equal(draftTotals(scaled).calories, draftTotals(items).calories + (rice?.nutrition.calories || 0));
  });

  it('18. historical grouped logs stay valid snapshots after later edits', async () => {
    const items = await resolveInterpretation(plateInterpretation(), {
      searchLocal: () => ({ query: '', classification: 'none', results: [] }),
      provider: new MockUsda((query) => {
        if (/chicken/i.test(query)) return [usdaChickenGrilled];
        if (/rice/i.test(query)) return [usdaRiceCooked];
        if (/kimchi/i.test(query)) return [usdaKimchi];
        return [];
      }),
    });
    const request = draftToCreateRequest({
      displayName: 'Chicken, Rice & Kimchi',
      items,
      assumptions: [],
      confidence: 'medium',
      usedGemini: true,
      cached: false,
      originalInput: 'plate',
      interpretation: plateInterpretation(),
      requestType: 'text_parse',
    });
    const originalRice = request.logs.find(log => /rice/i.test(log.display_name));
    const edited = scaleEstimateItem(items.find(item => /rice/i.test(item.name))!, { quantity: 3 });
    assert.notEqual(originalRice?.calories, edited.nutrition.calories);
    assert.equal(originalRice?.calories, items.find(item => /rice/i.test(item.name))?.nutrition.calories);
  });
});

describe('Phase 6B photo resolution', () => {
  it('19. a food photo is interpreted through the shared gate', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const result = await estimate({ type: 'photo', image: photo(3) }, { foodAi, store });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.requestType, 'photo_estimate');
    assert.equal(foodAi.imageCalls, 1);
    assert.equal((await store.listUsage())[0]?.requestType, 'photo_estimate');
  });

  it('20. photo plus description are both included in interpretation', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    await estimate({
      type: 'photo',
      image: photo(4),
      text: 'homemade chicken enchiladas, two of them',
    }, { foodAi });
    assert.equal(foodAi.lastContext, 'homemade chicken enchiladas, two of them');
    assert.ok(foodAi.lastImage?.dataBase64);
  });

  it('21. the same photo and context hit cache', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const input = { type: 'photo' as const, image: photo(5), text: 'two enchiladas' };
    const first = await estimate(input, { foodAi, store });
    const second = await estimate(input, { foodAi, store });
    assert.equal(first.status, 'draft');
    assert.equal(second.status, 'draft');
    if (second.status !== 'draft') return;
    assert.equal(foodAi.imageCalls, 1);
    assert.equal(second.draft.cached, true);
  });

  it('22. different image bytes use a different cache key', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    await estimate({ type: 'photo', image: photo(6), text: 'plate' }, { foodAi, store });
    await estimate({ type: 'photo', image: photo(7), text: 'plate' }, { foodAi, store });
    assert.equal(foodAi.imageCalls, 2);
  });

  it('23. a rejected photo draft is not added to history', async () => {
    const result = await estimate({ type: 'photo', image: photo(8) }, {
      foodAi: new MockFoodAI(tamaleInterpretation),
    });
    assert.equal(result.status, 'draft');
    assert.equal(createsCanonicalFoodFromEstimate(), false);
  });

  it('24. an accepted photo estimate stores structured logs and no image', async () => {
    const result = await estimate({ type: 'photo', image: photo(8) }, {
      foodAi: new MockFoodAI(tamaleInterpretation),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    const request = draftToCreateRequest(result.draft);
    const dumped = JSON.stringify(request);
    assert.equal(dumped.includes(photo(8).dataBase64), false);
    assert.equal(request.logs[0].metadata?.persistedImage, false);
    assert.equal(shouldPersistFoodPhoto(), false);
  });

  it('25. a photo with multiple visible foods becomes components', async () => {
    const result = await estimate({ type: 'photo', image: photo(10) }, {
      usda: new MockUsda((query) => {
        if (/chicken/i.test(query)) return [usdaChickenGrilled];
        if (/rice/i.test(query)) return [usdaRiceCooked];
        if (/kimchi/i.test(query)) return [usdaKimchi];
        return [];
      }),
      foodAi: new MockFoodAI(plateInterpretation()),
    });
    assert.equal(result.status, 'draft');
    if (result.status !== 'draft') return;
    assert.equal(result.draft.items.length, 3);
  });

  it('26. malformed or low-confidence vision output stays on review or manual fallback', async () => {
    const malformed = await estimate({ type: 'photo', image: photo(11) }, {
      foodAi: new MockFoodAI(new ProviderError('malformed', 'bad json')),
    });
    assert.equal(malformed.status, 'error');
    if (malformed.status !== 'error') return;
    assert.equal(malformed.fallback, 'manual');
    assert.equal(malformed.message, "Couldn't estimate this food.");
  });
});

describe('Phase 6B budget and gate', () => {
  it('27. exhausted budget does not call Gemini', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 0.001, warningBudgetUsd: 0.001 });
    store.usage.push({
      id: 1,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      requestType: 'text_parse',
      inputTokens: 10,
      outputTokens: 10,
      estimatedCostUsd: 0.001,
      success: true,
      cached: false,
      metadata: { reservation_status: 'committed' },
      createdAt: new Date().toISOString(),
    });
    const result = await estimate({ type: 'text', text: 'mystery casserole' }, { foodAi, store });
    assert.equal(result.status, 'error');
    if (result.status !== 'error') return;
    assert.equal(result.code, 'budget_exhausted');
    assert.equal(foodAi.parseCalls, 0);
  });

  it('28. cached estimate may return after budget is exhausted', async () => {
    const foodAi = new MockFoodAI(tamaleInterpretation);
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const first = await estimate({ type: 'text', text: 'mystery casserole' }, { foodAi, store });
    assert.equal(first.status, 'draft');
    store.usage.push({
      id: 99,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      requestType: 'text_parse',
      inputTokens: 10,
      outputTokens: 10,
      estimatedCostUsd: 3,
      success: true,
      cached: false,
      metadata: { reservation_status: 'committed' },
      createdAt: new Date().toISOString(),
    });
    const second = await estimate({ type: 'text', text: 'mystery casserole' }, { foodAi, store });
    assert.equal(second.status, 'draft');
    if (second.status !== 'draft') return;
    assert.equal(second.draft.cached, true);
    assert.equal(foodAi.parseCalls, 1);
  });

  it('29. provider failure reconciles the reservation', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const result = await estimate({ type: 'text', text: 'mystery casserole' }, {
      foodAi: new MockFoodAI(new ProviderError('timeout', 'Gemini timed out')),
      store,
    });
    assert.equal(result.status, 'error');
    const usage = await store.listUsage();
    assert.equal(usage.length, 1);
    assert.equal(usage[0].success, false);
    assert.equal(usage[0].metadata?.reservation_status, 'released');
  });

  it('30. personal and USDA paths write zero AI usage', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const foodAi = new MockFoodAI(tamaleInterpretation);
    await estimate({ type: 'text', text: 'banana' }, {
      records: [localRecord('Banana', { calories: 105 })],
      foodAi,
      store,
    });
    await estimate({ type: 'text', text: 'banana' }, {
      usda: new MockUsda(() => [usdaBanana]),
      foodAi,
      store,
    });
    assert.equal(foodAi.parseCalls, 0);
    assert.equal((await store.listUsage()).length, 0);
  });
});
