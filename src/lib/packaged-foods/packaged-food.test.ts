import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderError } from '../../types/nutrition-provider';
import type { PackagedFoodResult } from '../../types/packaged-food';
import { planCanonicalUpsert } from './canonical';
import { emptyNutritionLabel, labelToPackagedFood } from './from-label';
import { shouldPersistLabelImage } from './image';
import { packagedFoodToFoodLogInput } from './log';
import { lookupBarcode } from './lookup';
import {
  chooseSelectedNutrition,
  normalizeOpenFoodFactsProduct,
  parseServing,
  scalePackagedNutrition,
} from './normalize';
import { OpenFoodFactsProvider } from './off-provider';
import { savePackagedFood, type CanonicalFoodStore } from './save';
import {
  OFF_MISSING_MACRO_PAYLOAD,
  OFF_MISSING_SERVING_WEIGHT_PAYLOAD,
  OFF_NOT_FOUND_PAYLOAD,
  OFF_PROTEIN_BAR_PAYLOAD,
  proteinBarProduct,
} from './fixtures';

class MemoryStore implements CanonicalFoodStore {
  foods: PackagedFoodResult[] = [];
  offCalls = 0;

  async findByBarcode(barcode: string) {
    return this.foods.find(food => food.barcode === barcode) || null;
  }

  async upsert(record: any, existingId: number | null) {
    if (existingId) {
      const index = this.foods.findIndex(food => food.foodId === existingId);
      const next = {
        ...this.foods[index],
        name: record.name,
        barcode: record.sourceExternalId,
        foodId: existingId,
        selectedNutrition: {
          calories: record.calories,
          protein: record.protein,
          carbs: record.carbs,
          fat: record.fat,
        },
      };
      this.foods[index] = next;
      return next;
    }
    const created: PackagedFoodResult = {
      provider: record.sourceType === 'nutrition_label' ? 'nutrition_label' : 'open_food_facts',
      externalId: record.sourceExternalId || record.name,
      barcode: record.sourceExternalId || '',
      name: record.name,
      brand: record.metadata?.brand ?? null,
      nutritionPer100g: record.metadata?.nutritionPer100g ?? null,
      serving: record.metadata?.serving ?? null,
      nutritionPerServing: {
        calories: record.calories,
        protein: record.protein,
        carbs: record.carbs,
        fat: record.fat,
      },
      selectedNutrition: {
        calories: record.calories,
        protein: record.protein,
        carbs: record.carbs,
        fat: record.fat,
      },
      foodId: this.foods.length + 1,
      metadata: record.metadata,
    };
    this.foods.push(created);
    return created;
  }
}

const mockOff = (payload: unknown, error?: ProviderError) => {
  let calls = 0;
  const provider = new OpenFoodFactsProvider({
    fetchImpl: async () => {
      calls += 1;
      if (error) throw error;
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
  return { provider, get calls() { return calls; } };
};

describe('Open Food Facts normalization', () => {
  it('maps a known barcode product from Open Food Facts', () => {
    const product = normalizeOpenFoodFactsProduct('0123456789012', OFF_PROTEIN_BAR_PAYLOAD);
    assert.equal(product?.name, 'Protein Bar');
    assert.equal(product?.brand, 'Brand Name');
    assert.equal(product?.barcode, '0123456789012');
    assert.equal(product?.selectedNutrition?.calories, 210);
    assert.equal(product?.selectedNutrition?.protein, 20);
    assert.equal(product?.serving?.gramWeight, 60);
  });

  it('keeps missing macros null', () => {
    const product = normalizeOpenFoodFactsProduct('1111111111111', OFF_MISSING_MACRO_PAYLOAD);
    assert.equal(product?.selectedNutrition?.protein, null);
    assert.equal(product?.selectedNutrition?.carbs, null);
    assert.equal(product?.nutritionPer100g?.protein, null);
  });

  it('does not invent grams for a serving without weight', () => {
    const product = normalizeOpenFoodFactsProduct('0987654321098', OFF_MISSING_SERVING_WEIGHT_PAYLOAD);
    assert.equal(product?.serving?.description, '1 bar');
    assert.equal(product?.serving?.gramWeight, null);
    assert.equal(product?.selectedNutrition?.calories, 210);
    assert.equal(chooseSelectedNutrition({
      nutritionPer100g: { calories: 350, protein: 33, carbs: 37, fat: 12 },
      nutritionPerServing: { calories: 210, protein: 20, carbs: 22, fat: 7 },
      serving: parseServing({ serving_size: '1 bar' }),
    })?.calories, 210);
  });

  it('does not treat a milliliter serving_quantity as grams', () => {
    const product = normalizeOpenFoodFactsProduct('5449000000996', {
      status: 1,
      product: {
        code: '5449000000996',
        product_name: 'Coca-Cola',
        serving_size: '1 portion (330 ml)',
        serving_quantity: 330,
        nutriments: {
          'energy-kcal_100g': 42,
          'energy-kcal_serving': 139,
          proteins_serving: 0,
          carbohydrates_serving: 35,
          fat_serving: 0,
        },
      },
    });
    assert.equal(product?.serving?.gramWeight, null);
    assert.equal(product?.selectedNutrition?.calories, 139);
  });
});

describe('packaged food quantity and logging', () => {
  it('doubles nutrition for quantity 2 without another provider call', () => {
    const doubled = scalePackagedNutrition(proteinBarProduct.selectedNutrition, 2);
    const log = packagedFoodToFoodLogInput(proteinBarProduct, 2);
    assert.deepEqual(doubled, { calories: 420, protein: 40, carbs: 44, fat: 14 });
    assert.equal(log.calories, 420);
    assert.equal(log.quantity, 2);
    assert.equal(log.source_type, 'open_food_facts');
    assert.equal(log.nutrition_source, 'open_food_facts');
    assert.equal(log.metadata.barcode, '0123456789012');
  });

  it('creates a food_log snapshot from an accepted barcode product', () => {
    const log = packagedFoodToFoodLogInput(proteinBarProduct, 1);
    assert.equal(log.display_name, 'Protein Bar');
    assert.equal(log.calories, 210);
    assert.equal(log.protein, 20);
    assert.equal(log.source_type, 'open_food_facts');
    assert.equal(log.original_input, 'barcode:0123456789012');
  });
});

describe('canonical barcode foods', () => {
  it('plans a foods row for an accepted barcode product', () => {
    const plan = planCanonicalUpsert(null, proteinBarProduct, 'open_food_facts');
    assert.equal(plan.action, 'insert');
    assert.equal(plan.record.sourceExternalId, '0123456789012');
    assert.equal(plan.record.sourceType, 'open_food_facts');
    assert.equal(plan.record.foodType, 'packaged');
  });

  it('updates the same barcode instead of inserting a duplicate', async () => {
    const store = new MemoryStore();
    const first = await savePackagedFood(proteinBarProduct, 1, store);
    const second = await savePackagedFood({ ...proteinBarProduct, name: 'Protein Bar' }, 1, store);
    assert.equal(first.action, 'insert');
    assert.equal(second.action, 'update');
    assert.equal(store.foods.length, 1);
    assert.equal(first.product.foodId, second.product.foodId);
  });
});

describe('local-first barcode lookup', () => {
  it('returns a local canonical product without calling Open Food Facts', async () => {
    const store = new MemoryStore();
    await savePackagedFood(proteinBarProduct, 1, store);
    const off = mockOff(OFF_PROTEIN_BAR_PAYLOAD);
    const result = await lookupBarcode('0123456789012', {
      local: store,
      provider: off.provider,
    });
    assert.equal(result.status, 'found');
    assert.equal(result.source, 'local');
    assert.equal(result.usedOpenFoodFacts, false);
    assert.equal(off.calls, 0);
  });

  it('looks up Open Food Facts when the barcode is unknown locally', async () => {
    const off = mockOff(OFF_PROTEIN_BAR_PAYLOAD);
    const result = await lookupBarcode('0123456789012', {
      local: { findByBarcode: async () => null },
      provider: off.provider,
    });
    assert.equal(result.status, 'found');
    assert.equal(result.source, 'open_food_facts');
    assert.equal(result.usedOpenFoodFacts, true);
    assert.equal(result.product?.name, 'Protein Bar');
  });

  it('offers a label/manual fallback for an unknown barcode', async () => {
    const result = await lookupBarcode('0000000000000', {
      local: { findByBarcode: async () => null },
      provider: mockOff(OFF_NOT_FOUND_PAYLOAD).provider,
    });
    assert.equal(result.status, 'not_found');
    assert.equal(result.usedOpenFoodFacts, true);
    assert.equal(result.product, null);
    assert.equal(result.message, 'Product not found');
  });

  it('returns a recoverable fallback when Open Food Facts fails', async () => {
    const result = await lookupBarcode('0123456789012', {
      local: { findByBarcode: async () => null },
      provider: mockOff({}, new ProviderError('timeout', 'timed out')).provider,
    });
    assert.equal(result.status, 'provider_error');
    assert.equal(result.usedOpenFoodFacts, true);
    assert.match(result.message || '', /timed out|unavailable/i);
  });
});

describe('nutrition label products', () => {
  it('keeps a known barcode on the label fallback path', () => {
    const label = emptyNutritionLabel('0123456789012');
    label.productName = 'Protein Bar';
    label.calories = 210;
    label.protein = 20;
    label.carbs = 22;
    label.fat = 7;
    const product = labelToPackagedFood(label, '0123456789012');
    assert.equal(product.barcode, '0123456789012');
    assert.equal(product.provider, 'nutrition_label');
    const log = packagedFoodToFoodLogInput(product, 1);
    assert.equal(log.source_type, 'nutrition_label');
    assert.equal(log.metadata.barcode, '0123456789012');
    const plan = planCanonicalUpsert(null, product, 'nutrition_label');
    assert.equal(plan.record.sourceExternalId, '0123456789012');
    assert.equal(plan.record.sourceType, 'nutrition_label');
  });

  it('still builds a saveable product when Gemini is unavailable', () => {
    const label = emptyNutritionLabel();
    label.productName = 'Manual Bar';
    label.calories = 180;
    label.protein = null;
    const product = labelToPackagedFood(label);
    assert.equal(product.name, 'Manual Bar');
    assert.equal(product.selectedNutrition?.calories, 180);
    assert.equal(product.selectedNutrition?.protein, null);
    const log = packagedFoodToFoodLogInput(product, 1);
    assert.equal(log.protein, null);
    assert.equal(log.source_type, 'nutrition_label');
  });

  it('does not persist nutrition-label images', () => {
    assert.equal(shouldPersistLabelImage(), false);
    const product = labelToPackagedFood({
      ...emptyNutritionLabel('555'),
      productName: 'Label Bar',
      calories: 100,
    }, '555');
    assert.equal(product.metadata?.persistedImage, false);
  });
});
