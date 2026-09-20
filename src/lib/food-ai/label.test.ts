import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderError } from '../../types/nutrition-provider';
import type { FoodAIProvider, NutritionLabelResult } from '../../types/nutrition-label';
import { handleExtractNutritionLabel } from './extract';
import { GeminiFoodAIProvider } from './gemini-label';
import { LABEL_RATE_LIMIT, resetRateLimit } from './rate-limit';
import { sanitizeNutritionLabel, validateNutritionLabel } from './validate-label';

const extracted: NutritionLabelResult = {
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
  constructor(private result: NutritionLabelResult | Error = extracted) {}
  async extractNutritionLabel() {
    this.calls += 1;
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
  async parseFoodDescription(): Promise<import('../../types/food-interpretation').FoodInterpretation> {
    throw new Error('parseFoodDescription is not used by nutrition-label tests');
  }
  async analyzeFoodImage(): Promise<import('../../types/food-interpretation').FoodInterpretation> {
    throw new Error('analyzeFoodImage is not used by nutrition-label tests');
  }
}

const smallImage = {
  mimeType: 'image/jpeg',
  dataBase64: Buffer.alloc(120, 1).toString('base64'),
};

describe('nutrition label extraction', () => {
  beforeEach(() => resetRateLimit());

  it('returns an editable structured result', async () => {
    const provider = new MockLabelProvider();
    const result = await handleExtractNutritionLabel(
      { image: smallImage, barcode: '0123456789012', clientKey: 'test-a' },
      { provider }
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.body.label.productName, 'Protein Bar');
    assert.equal(result.body.label.calories, 210);
    assert.equal(result.body.label.barcode, '0123456789012');
    assert.equal(result.body.persistedImage, false);
    assert.deepEqual(result.body.warnings, []);
    const edited = sanitizeNutritionLabel({ ...result.body.label, calories: 200 });
    assert.equal(edited.calories, 200);
  });

  it('flags a major macro/calorie discrepancy for review', () => {
    const warnings = validateNutritionLabel({
      ...extracted,
      calories: 800,
    });
    assert.equal(warnings[0]?.code, 'macro_calorie_mismatch');
    assert.ok((warnings[0]?.expectedCalories || 0) < 300);
  });

  it('does not flag ordinary label rounding', () => {
    assert.deepEqual(validateNutritionLabel(extracted), []);
  });

  it('falls back to manual entry when Gemini is unavailable', async () => {
    const result = await handleExtractNutritionLabel(
      { image: smallImage, clientKey: 'test-b' },
      { provider: new MockLabelProvider(new ProviderError('missing_key', 'GEMINI_API_KEY is not configured')) }
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 503);
    assert.equal(result.body.fallback, 'manual');
    assert.equal(result.body.persistedImage, false);
  });

  it('does not persist the uploaded image', async () => {
    const result = await handleExtractNutritionLabel(
      { image: smallImage, clientKey: 'test-c' },
      { provider: new MockLabelProvider() }
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.body.persistedImage, false);
    assert.equal('image' in result.body, false);
    assert.equal('dataBase64' in result.body.label, false);
  });

  it('rate-limits repeated paid label requests', async () => {
    const provider = new MockLabelProvider();
    for (let i = 0; i < LABEL_RATE_LIMIT.maxRequests; i += 1) {
      const allowed = await handleExtractNutritionLabel(
        { image: smallImage, clientKey: 'repeat-user' },
        { provider }
      );
      assert.equal(allowed.ok, true);
    }
    const blocked = await handleExtractNutritionLabel(
      { image: smallImage, clientKey: 'repeat-user' },
      { provider }
    );
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.code, 'rate_limited');
    assert.ok((blocked.body.retryAfterSeconds || 0) > 0);
    assert.equal(provider.calls, LABEL_RATE_LIMIT.maxRequests);
  });

  it('rejects oversized images before calling Gemini', async () => {
    const provider = new MockLabelProvider();
    const result = await handleExtractNutritionLabel(
      {
        image: {
          mimeType: 'image/jpeg',
          dataBase64: Buffer.alloc(LABEL_RATE_LIMIT.maxImageBytes + 1000, 2).toString('base64'),
        },
        clientKey: 'test-d',
      },
      { provider }
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 413);
    assert.equal(provider.calls, 0);
  });
});

describe('GeminiFoodAIProvider', () => {
  it('parses structured Gemini JSON without guessing missing macros', async () => {
    const provider = new GeminiFoodAIProvider({
      apiKey: 'test-key',
      fetchImpl: async () => new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                productName: 'Yogurt',
                serving: { description: '1 cup', amount: 1, unit: 'cup', gramWeight: 170 },
                calories: 150,
                protein: 12,
                carbs: 17,
                fat: null,
                servingsPerContainer: 1,
                confidence: { calories: 'high', protein: 'high', carbs: 'medium', fat: 'low' },
              }),
            }],
          },
        }],
      }), { status: 200 }),
    });
    const label = await provider.extractNutritionLabel(smallImage);
    assert.equal(label.productName, 'Yogurt');
    assert.equal(label.fat, null);
    assert.equal(label.calories, 150);
  });

  it('parses a structured food interpretation without treating calories as the source of truth', async () => {
    const provider = new GeminiFoodAIProvider({
      apiKey: 'test-key',
      fetchImpl: async () => new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                displayName: 'Homemade Pork Tamale',
                portion: { description: '1 medium tamale', estimatedWeightGrams: 115 },
                components: [{
                  name: 'pork tamale',
                  quantityDescription: '1 medium',
                  estimatedWeightGrams: 115,
                  attributes: { filling: 'pork', preparation: 'traditional' },
                }],
                assumptions: ['corn masa', 'pork filling'],
                confidence: 'medium',
                fallbackNutrition: {
                  calories: 310,
                  protein: 12,
                  carbs: 34,
                  fat: 14,
                  calorieLow: 250,
                  calorieHigh: 380,
                },
              }),
            }],
          },
        }],
      }), { status: 200 }),
    });
    const parsed = await provider.parseFoodDescription('medium homemade pork tamale');
    assert.equal(parsed.displayName, 'Homemade Pork Tamale');
    assert.equal(parsed.portion.estimatedWeightGrams, 115);
    assert.equal(parsed.components[0].name, 'pork tamale');
    assert.equal(parsed.fallbackNutrition?.calorieLow, 250);
  });
});
