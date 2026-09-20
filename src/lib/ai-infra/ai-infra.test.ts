import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderError } from '../../types/nutrition-provider';
import type { FoodAIProvider, NutritionLabelResult } from '../../types/nutrition-label';
import { lookupBarcode } from '../packaged-foods/lookup';
import { OpenFoodFactsProvider } from '../packaged-foods/off-provider';
import { resolveQuickLog } from '../quick-log/resolve';
import { handleExtractNutritionLabel } from '../food-ai/extract';
import { AiGateError } from '../../types/ai-infra';
import { BUDGET_EXHAUSTED_MESSAGE, NUTRITION_LABEL_PROMPT_VERSION, NUTRITION_LABEL_SCHEMA_VERSION, runPaidAiRequest } from './gate';
import { buildAiRequestHash, hashNutritionLabelRequest } from './hash';
import { MemoryAiStore } from './store';

const label: NutritionLabelResult = {
  productName: 'Protein Bar',
  serving: { description: '1 bar', amount: 1, unit: 'bar', gramWeight: 60 },
  calories: 210,
  protein: 20,
  carbs: 22,
  fat: 7,
  servingsPerContainer: 12,
  barcode: null,
  confidence: { calories: 'high', protein: 'high', carbs: 'high', fat: 'high' },
};

class MockLabelProvider implements FoodAIProvider {
  calls = 0;
  constructor(private result: NutritionLabelResult | Error = label) {}
  async extractNutritionLabel() {
    this.calls += 1;
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
  async parseFoodDescription(): Promise<import('../../types/food-interpretation').FoodInterpretation> {
    throw new Error('parseFoodDescription is not used by AI infra tests');
  }
  async analyzeFoodImage(): Promise<import('../../types/food-interpretation').FoodInterpretation> {
    throw new Error('analyzeFoodImage is not used by AI infra tests');
  }
}

const image = (fill = 7) => ({
  mimeType: 'image/jpeg' as const,
  dataBase64: Buffer.alloc(180, fill).toString('base64'),
});

const extract = (
  provider: MockLabelProvider,
  store: MemoryAiStore,
  extras: { barcode?: string; imageFill?: number; requireProviderConfig?: boolean } = {}
) => handleExtractNutritionLabel(
  {
    image: image(extras.imageFill ?? 7),
    barcode: extras.barcode ?? null,
    clientKey: `key-${Math.random()}`,
  },
  { provider, store, requireProviderConfig: extras.requireProviderConfig }
);

describe('AI request hashing', () => {
  it('uses different cache keys for the same description but different image bytes', () => {
    const first = hashNutritionLabelRequest({
      dataBase64: image(1).dataBase64,
      accompanyingText: 'protein bar',
      schemaVersion: NUTRITION_LABEL_SCHEMA_VERSION,
      promptVersion: NUTRITION_LABEL_PROMPT_VERSION,
    });
    const second = hashNutritionLabelRequest({
      dataBase64: image(2).dataBase64,
      accompanyingText: 'protein bar',
      schemaVersion: NUTRITION_LABEL_SCHEMA_VERSION,
      promptVersion: NUTRITION_LABEL_PROMPT_VERSION,
    });
    assert.notEqual(first, second);
  });

  it('uses a different cache key when the prompt/schema version changes', () => {
    const first = buildAiRequestHash({
      requestType: 'nutrition_label',
      schemaVersion: 'nutrition_label.v1',
      promptVersion: 'nutrition_label.prompt.v1',
      imageSha256: 'abc',
    });
    const second = buildAiRequestHash({
      requestType: 'nutrition_label',
      schemaVersion: 'nutrition_label.v2',
      promptVersion: 'nutrition_label.prompt.v1',
      imageSha256: 'abc',
    });
    assert.notEqual(first, second);
  });
});

describe('AI budget/cache gate', () => {
  it('records a paid label request after a cache miss and budget pass', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const provider = new MockLabelProvider();
    const result = await extract(provider, store);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.body.cached, false);
    assert.equal(provider.calls, 1);
    const usage = await store.listUsage();
    assert.equal(usage.length, 1);
    assert.equal(usage[0].success, true);
    assert.equal(usage[0].cached, false);
    assert.equal(usage[0].requestType, 'nutrition_label');
    assert.ok(usage[0].estimatedCostUsd > 0);
  });

  it('returns a cache hit and does not call the provider again', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const provider = new MockLabelProvider();
    await extract(provider, store);
    const second = await extract(provider, store);
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.body.cached, true);
    assert.equal(provider.calls, 1);
  });

  it('calls the provider again when the cache is expired', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const provider = new MockLabelProvider();
    await extract(provider, store);
    const [hash] = [...store.cache.keys()];
    const entry = store.cache.get(hash)!;
    entry.expiresAt = new Date(Date.now() - 1000).toISOString();
    const second = await extract(provider, store);
    assert.equal(second.ok, true);
    assert.equal(provider.calls, 2);
  });

  it('allows requests below the warning threshold', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    store.usage.push({
      id: 99,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      requestType: 'nutrition_label',
      inputTokens: 10,
      outputTokens: 10,
      estimatedCostUsd: 0.5,
      success: true,
      cached: false,
      metadata: { reservation_status: 'committed' },
      createdAt: new Date().toISOString(),
    });
    const provider = new MockLabelProvider();
    const result = await extract(provider, store);
    assert.equal(result.ok, true);
    assert.equal(provider.calls, 1);
  });

  it('allows requests above the warning but below the hard ceiling', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    store.usage.push({
      id: 99,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      requestType: 'nutrition_label',
      inputTokens: 10,
      outputTokens: 10,
      estimatedCostUsd: 2.4,
      success: true,
      cached: false,
      metadata: { reservation_status: 'committed' },
      createdAt: new Date().toISOString(),
    });
    const allowed = await runPaidAiRequest({
      requestType: 'nutrition_label',
      requestHash: 'warn-ok',
      reservedCostUsd: 0.2,
      execute: async () => ({ result: { ok: true } }),
    }, store);
    assert.equal(allowed.cached, false);
  });

  it('rejects a request that would exceed the hard ceiling without calling the provider', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    store.usage.push({
      id: 99,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      requestType: 'nutrition_label',
      inputTokens: 10,
      outputTokens: 10,
      estimatedCostUsd: 2.99,
      success: true,
      cached: false,
      metadata: { reservation_status: 'committed' },
      createdAt: new Date().toISOString(),
    });
    let called = 0;
    await assert.rejects(
      () => runPaidAiRequest({
        requestType: 'nutrition_label',
        requestHash: 'over-budget',
        reservedCostUsd: 0.02,
        execute: async () => {
          called += 1;
          return { result: { ok: true } };
        },
      }, store),
      (error: unknown) => error instanceof AiGateError && error.code === 'budget_exhausted'
    );
    assert.equal(called, 0);
  });

  it('cannot jointly exceed the reserved budget under concurrent requests', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 0.03, warningBudgetUsd: 0.02 });
    let executions = 0;
    const run = () => runPaidAiRequest({
      requestType: 'nutrition_label',
      requestHash: `concurrent-${Math.random()}`,
      reservedCostUsd: 0.02,
      execute: async () => {
        executions += 1;
        await new Promise(resolve => setTimeout(resolve, 20));
        return { result: { ok: true } };
      },
    }, store);

    const results = await Promise.allSettled([run(), run()]);
    const fulfilled = results.filter(result => result.status === 'fulfilled');
    const rejected = results.filter(result => result.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(executions, 1);
    const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
    assert.equal(rejectedError instanceof AiGateError, true);
    assert.equal(rejectedError.code, 'budget_exhausted');
    const summary = await store.getMonthSummary();
    assert.ok(summary.spendUsd <= 0.03);
  });

  it('records provider failure and releases the reservation', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    await assert.rejects(
      () => runPaidAiRequest({
        requestType: 'nutrition_label',
        requestHash: 'failed-call',
        reservedCostUsd: 0.5,
        execute: async () => {
          throw new ProviderError('provider_error', 'Gemini down');
        },
      }, store),
      /Gemini down/
    );
    const usage = await store.listUsage();
    assert.equal(usage.length, 1);
    assert.equal(usage[0].success, false);
    assert.equal(usage[0].estimatedCostUsd, 0);
    assert.equal(usage[0].metadata.reservation_status, 'released');
    assert.equal(usage[0].inputTokens, null);

    const recovered = await runPaidAiRequest({
      requestType: 'nutrition_label',
      requestHash: 'after-failure',
      reservedCostUsd: 0.5,
      execute: async () => ({ result: { ok: true } }),
    }, store);
    assert.equal(recovered.cached, false);
  });

  it('does not count cached requests against paid monthly spend', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const provider = new MockLabelProvider();
    await extract(provider, store);
    const afterPaid = await store.getMonthSummary();
    await extract(provider, store);
    const afterCache = await store.getMonthSummary();
    assert.equal(afterCache.spendUsd, afterPaid.spendUsd);
    assert.equal(afterCache.cachedRequestCount, 1);
    const cachedRow = (await store.listUsage()).find(row => row.cached);
    assert.equal(cachedRow?.estimatedCostUsd, 0);
  });

  it('fails gracefully when Gemini configuration is missing', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const result = await extract(new MockLabelProvider(), store, { requireProviderConfig: true });
      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.status, 503);
      assert.equal(result.body.code, 'missing_configuration');
      assert.equal(result.body.fallback, 'manual');
      assert.equal((await store.listUsage()).length, 0);
    } finally {
      if (previous != null) process.env.GEMINI_API_KEY = previous;
    }
  });

  it('keeps manual nutrition-label entry usable after budget exhaustion', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 0.001, warningBudgetUsd: 0.001 });
    store.usage.push({
      id: 1,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      requestType: 'nutrition_label',
      inputTokens: 10,
      outputTokens: 10,
      estimatedCostUsd: 0.001,
      success: true,
      cached: false,
      metadata: { reservation_status: 'committed' },
      createdAt: new Date().toISOString(),
    });
    const result = await extract(new MockLabelProvider(), store);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.body.code, 'budget_exhausted');
    assert.equal(result.body.fallback, 'manual');
    assert.equal(result.body.error, BUDGET_EXHAUSTED_MESSAGE);
  });

  it('does not persist image bytes in usage or cache', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    const photo = image(9);
    await handleExtractNutritionLabel(
      { image: photo, barcode: '0123', clientKey: 'img' },
      { provider: new MockLabelProvider(), store }
    );
    const dumped = JSON.stringify({
      usage: await store.listUsage(),
      cache: [...store.cache.values()],
    });
    assert.equal(dumped.includes(photo.dataBase64), false);
    assert.equal(dumped.includes('dataBase64'), false);
  });
});

describe('non-AI paths stay off the budget', () => {
  it('does not write AI usage for barcode or USDA resolve', async () => {
    const store = new MemoryAiStore({ monthlyBudgetUsd: 3, warningBudgetUsd: 2 });
    await lookupBarcode('0123456789012', {
      local: { findByBarcode: async () => null },
      provider: new OpenFoodFactsProvider({
        fetchImpl: async () => new Response(JSON.stringify({ status: 0 }), { status: 200 }),
      }),
    });
    await resolveQuickLog(
      { input: { type: 'text', text: 'banana' } },
      {
        searchLocal: async () => ({ query: 'banana', classification: 'none', results: [] }),
        provider: {
          async search() { return []; },
          async getFood() { throw new Error('unused'); },
        },
      }
    );
    assert.equal((await store.listUsage()).length, 0);
  });
});
