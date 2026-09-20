import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { candidateToFoodLogInput, createsCanonicalFood, foodLogToInput, quickCaloriesToFoodLogInput } from './log';
import { parseQuantityQuery } from './quantity';
import { deriveRecentFrequent } from './recents';
import { scaleNutrition } from './scale';
import { SEARCH_DEBOUNCE_MS, createSearchRequestGuard, shouldApplySearchResult, shouldAutoLog } from './search-session';
import { planUndo } from './undo';
import type { SearchCandidate } from '../../types/food-search';
import type { FoodLog } from '../../types/food-log';

const shake: SearchCandidate = {
  id: 12,
  entityType: 'meal_combo',
  name: 'Protein Shake',
  calories: 180,
  protein: 25,
  carbs: 8,
  fat: 3,
  servingDescription: '1 shake',
  source: 'meal_combo',
  confidence: null,
  usageCount: 4,
  lastUsedAt: '2026-09-19T12:00:00.000Z',
  match: { score: 0.96, type: 'exact' },
};

describe('quick log quantity parser', () => {
  it('parses 2 protein shakes as two servings', () => {
    const parsed = parseQuantityQuery('2 protein shakes');
    assert.equal(parsed.quantity, 2);
    assert.equal(parsed.foodQuery, 'protein shakes');
    assert.equal(parsed.canScaleByServing, true);
  });

  it('parses 1.5, half, and 1/2', () => {
    assert.equal(parseQuantityQuery('1.5 protein shakes').quantity, 1.5);
    assert.equal(parseQuantityQuery('half protein shake').quantity, 0.5);
    assert.equal(parseQuantityQuery('1/2 protein shake').quantity, 0.5);
  });

  it('parses attached weights without inventing a conversion', () => {
    const parsed = parseQuantityQuery('100g strawberries');
    assert.equal(parsed.quantity, 100);
    assert.equal(parsed.unit, 'g');
    assert.equal(parsed.unitKind, 'weight');
    assert.equal(parsed.foodQuery, 'strawberries');
    assert.equal(parsed.canScaleByServing, false);
  });
});

describe('quick log scaling and snapshots', () => {
  it('doubles nutrition for quantity 2', () => {
    const input = candidateToFoodLogInput(shake, {
      parsed: parseQuantityQuery('2 protein shakes'),
      originalInput: '2 protein shakes',
    });
    assert.equal(input.calories, 360);
    assert.equal(input.protein, 50);
    assert.equal(input.quantity, 2);
  });

  it('halves nutrition for quantity 0.5', () => {
    const input = candidateToFoodLogInput(shake, {
      parsed: parseQuantityQuery('half protein shake'),
      originalInput: 'half protein shake',
    });
    assert.equal(input.calories, 90);
    assert.equal(input.protein, 12.5);
  });

  it('keeps null macros null after scaling', () => {
    const scaled = scaleNutrition({ calories: 450, protein: null, carbs: null, fat: null }, 2);
    assert.deepEqual(scaled, { calories: 900, protein: null, carbs: null, fat: null });
  });

  it('does not invent a weight conversion without reference grams', () => {
    const input = candidateToFoodLogInput(shake, {
      parsed: parseQuantityQuery('6 oz protein shake'),
      originalInput: '6 oz protein shake',
    });
    assert.equal(input.calories, 180);
    assert.equal(input.serving_description, '6 oz protein shake');
  });

  it('logs an exact known food from the selected candidate', () => {
    const input = candidateToFoodLogInput(shake, { originalInput: 'protein shake' });
    assert.equal(input.display_name, 'Protein Shake');
    assert.equal(input.calories, 180);
    assert.equal(input.quantity, 1);
    assert.equal(input.source_type, 'meal_combo');
    assert.equal(input.source_id, 12);
  });

  it('snapshots candidate nutrition so later catalog changes cannot mutate it', () => {
    const mutable = { ...shake, calories: 180 };
    const input = candidateToFoodLogInput(mutable, { originalInput: 'protein shake' });
    mutable.calories = 999;
    assert.equal(input.calories, 180);
    assert.equal(input.source_type, 'meal_combo');
    assert.equal(input.source_id, 12);
    assert.equal(input.nutrition_source, 'catalog');
  });
});

describe('quick log search behavior', () => {
  it('debounces local search and drops stale results', () => {
    assert.ok(SEARCH_DEBOUNCE_MS >= 150 && SEARCH_DEBOUNCE_MS <= 250);
    const guard = createSearchRequestGuard();
    const first = guard.nextId();
    const second = guard.nextId();
    assert.equal(shouldApplySearchResult(first, second), false);
    assert.equal(guard.isCurrent(second), true);
    assert.equal(guard.isCurrent(first), false);
  });

  it('never auto-logs an ambiguous or exact search', () => {
    assert.equal(shouldAutoLog('ambiguous'), false);
    assert.equal(shouldAutoLog('exact'), false);
  });
});

describe('quick calories', () => {
  it('stores unknown macros as null and does not create a canonical food', () => {
    const input = quickCaloriesToFoodLogInput({ name: 'Birthday cake', calories: 450 });
    assert.equal(input.calories, 450);
    assert.equal(input.protein, null);
    assert.equal(input.carbs, null);
    assert.equal(input.fat, null);
    assert.equal(input.source_type, 'quick_calories');
    assert.equal(input.nutrition_source, 'user_entered');
    assert.equal(createsCanonicalFood(input), false);
  });
});

describe('recent one-tap snapshot and undo plans', () => {
  it('creates a durable snapshot from a recent candidate', () => {
    const recent = deriveRecentFrequent([
      {
        id: 44,
        logged_at: '2026-09-20T15:00:00.000Z',
        group_id: null,
        display_name: 'Protein Shake',
        source_type: 'meal_combo',
        source_id: 12,
        nutrition_source: 'catalog',
        quantity: 1,
        serving_description: '1 shake',
        weight_grams: null,
        calories: 180,
        protein: 25,
        carbs: 8,
        fat: 3,
        confidence: null,
        calorie_low: null,
        calorie_high: null,
        original_input: 'protein shake',
        metadata: {},
        created_at: '2026-09-20T15:00:00.000Z',
        updated_at: '2026-09-20T15:00:00.000Z',
      } as FoodLog,
    ]);

    const input = candidateToFoodLogInput(recent[0], { originalInput: 'recent:+' });
    assert.equal(input.calories, 180);
    assert.equal(input.display_name, 'Protein Shake');
    assert.equal(input.source_type, 'historical_log');
  });

  it('plans add and duplicate undo as durable deletes', () => {
    assert.deepEqual(planUndo({ type: 'add', logId: 9, label: 'Protein Shake', calories: 180 }), { op: 'delete', logId: 9 });
    assert.deepEqual(planUndo({ type: 'duplicate', logId: 11, label: 'Protein Shake', calories: 180 }), { op: 'delete', logId: 11 });
  });

  it('plans delete undo as a snapshot recreate', () => {
    const snapshot = candidateToFoodLogInput(shake, { originalInput: 'protein shake' });
    const plan = planUndo({ type: 'delete', snapshot, label: 'Protein Shake', calories: 180 });
    assert.equal(plan.op, 'create');
    if (plan.op === 'create') {
      assert.equal(plan.snapshot.calories, 180);
      assert.deepEqual(foodLogToInput({
        id: 1,
        logged_at: '2026-09-20T15:00:00.000Z',
        group_id: null,
        ...snapshot,
        serving_description: snapshot.serving_description ?? null,
        weight_grams: null,
        confidence: null,
        calorie_low: null,
        calorie_high: null,
        original_input: snapshot.original_input ?? null,
        metadata: snapshot.metadata || {},
        created_at: '2026-09-20T15:00:00.000Z',
        updated_at: '2026-09-20T15:00:00.000Z',
      } as FoodLog).calories, 180);
    }
  });
});
