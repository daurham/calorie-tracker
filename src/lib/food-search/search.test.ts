import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchLocalKnowledge } from './search';
import { aggregateHistoricalLogs } from './usage';
import type { RawSearchRecord } from '../../types/food-search';

const food = (
  name: string,
  extras: Partial<RawSearchRecord> = {}
): RawSearchRecord => ({
  id: extras.id ?? name,
  entityType: extras.entityType ?? 'meal_combo',
  name,
  calories: extras.calories ?? 300,
  protein: extras.protein ?? 10,
  carbs: extras.carbs ?? 30,
  fat: extras.fat ?? 10,
  usageCount: extras.usageCount ?? 0,
  lastUsedAt: extras.lastUsedAt ?? null,
  servingDescription: extras.servingDescription ?? null,
  confidence: extras.confidence ?? null,
  ...extras,
});

describe('local food search', () => {
  it('treats tamale as ambiguous choices, not an automatic pork subtype', () => {
    const result = searchLocalKnowledge('tamale', [
      food('Pork Tamale', { usageCount: 11 }),
      food('Chicken Tamale', { usageCount: 4 }),
    ]);

    assert.equal(result.classification, 'ambiguous');
    assert.deepEqual(result.results.map(item => item.name).sort(), ['Chicken Tamale', 'Pork Tamale']);
    assert.ok(result.results.every(item => item.match.type !== 'exact'));
  });

  it('ranks chicken tamale over pork tamale', () => {
    const result = searchLocalKnowledge('chicken tamale', [
      food('Pork Tamale'),
      food('Chicken Tamale'),
    ]);

    assert.equal(result.results[0].name, 'Chicken Tamale');
    assert.ok(['exact', 'strong'].includes(result.classification));
    assert.ok(result.results[0].match.score > (result.results[1]?.match.score || 0));
  });

  it('does not let pork frequency beat an explicit chicken query', () => {
    const result = searchLocalKnowledge('chicken tamale', [
      food('Pork Tamale', { usageCount: 100, lastUsedAt: '2026-09-19T12:00:00.000Z' }),
      food('Chicken Tamale', { usageCount: 1, lastUsedAt: '2026-08-01T12:00:00.000Z' }),
    ]);

    assert.equal(result.results[0].name, 'Chicken Tamale');
    assert.ok(['exact', 'strong'].includes(result.classification));
  });

  it('selects pork tamale for an explicit pork query', () => {
    const result = searchLocalKnowledge('pork tamale', [
      food('Pork Tamale', { usageCount: 2 }),
      food('Chicken Tamale', { usageCount: 40 }),
    ]);

    assert.equal(result.results[0].name, 'Pork Tamale');
    assert.ok(['exact', 'strong'].includes(result.classification));
  });

  it('does not strongly resolve diet coke to regular coke', () => {
    const result = searchLocalKnowledge('diet coke', [
      food('Coke', { usageCount: 80 }),
    ]);

    assert.notEqual(result.classification, 'strong');
    assert.notEqual(result.classification, 'exact');
    if (result.results[0]) {
      assert.equal(result.results[0].match.type, 'weak');
    }
  });

  it('prefers diet coke over more frequent regular coke', () => {
    const result = searchLocalKnowledge('diet coke', [
      food('Coke', { usageCount: 80 }),
      food('Diet Coke', { usageCount: 2 }),
    ]);

    assert.equal(result.results[0].name, 'Diet Coke');
    assert.ok(['exact', 'strong'].includes(result.classification));
  });

  it('does not strongly resolve skim milk to whole milk', () => {
    const result = searchLocalKnowledge('skim milk', [
      food('Whole Milk', { usageCount: 25 }),
    ]);

    assert.notEqual(result.classification, 'strong');
    assert.notEqual(result.classification, 'exact');
    if (result.results[0]) {
      assert.equal(result.results[0].match.type, 'weak');
    }
  });

  it('penalizes fried chicken for a grilled chicken query', () => {
    const result = searchLocalKnowledge('grilled chicken', [
      food('Fried Chicken', { usageCount: 30 }),
      food('Grilled Chicken', { usageCount: 2 }),
    ]);

    assert.equal(result.results[0].name, 'Grilled Chicken');
    const fried = result.results.find(item => item.name === 'Fried Chicken');
    if (fried) {
      assert.ok(fried.match.score < result.results[0].match.score);
      assert.equal(fried.match.type, 'weak');
    }
  });

  it('lets specific user terms outrank historical popularity', () => {
    const result = searchLocalKnowledge('turkey ham sandwich', [
      food('Ham Sandwich', { usageCount: 90 }),
      food('Turkey Ham Sandwich', { usageCount: 1 }),
    ]);

    assert.equal(result.results[0].name, 'Turkey Ham Sandwich');
  });

  it('makes historical one-off foods searchable without a foods row', () => {
    const result = searchLocalKnowledge('festival burrito', [
      food('Festival Burrito', {
        id: 88,
        entityType: 'historical_log',
        calories: 740,
        protein: null,
        carbs: 80,
        fat: 28,
        usageCount: 1,
        lastUsedAt: '2026-09-18T18:00:00.000Z',
      }),
    ]);

    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].entityType, 'historical_log');
    assert.equal(result.results[0].source, 'previous_log');
    assert.equal(result.results[0].calories, 740);
    assert.equal(result.results[0].protein, null);
  });

  it('dedupes repeated historical logs into one candidate using the latest snapshot', () => {
    const historical = aggregateHistoricalLogs([
      {
        id: 1,
        entityType: 'historical_log',
        name: 'Protein Shake',
        calories: 160,
        protein: 20,
        carbs: 8,
        fat: 3,
        loggedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        id: 2,
        entityType: 'historical_log',
        name: 'Protein Shake',
        calories: 180,
        protein: 25,
        carbs: 6,
        fat: 3,
        loggedAt: '2026-09-19T12:00:00.000Z',
      },
      {
        id: 3,
        entityType: 'historical_log',
        name: 'protein shake',
        calories: 170,
        protein: 22,
        carbs: 7,
        fat: 2,
        loggedAt: '2026-09-15T12:00:00.000Z',
      },
    ]);

    const result = searchLocalKnowledge('protein shake', historical);
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].usageCount, 3);
    assert.equal(result.results[0].calories, 180);
    assert.equal(result.results[0].protein, 25);
  });

  it('hides a historical duplicate when a catalog food already represents it', () => {
    const result = searchLocalKnowledge('chicken tamale', [
      food('Chicken Tamale', { id: 10, entityType: 'meal_combo', calories: 275 }),
      food('Chicken Tamale', {
        id: 77,
        entityType: 'historical_log',
        calories: 260,
        usageCount: 7,
        lastUsedAt: '2026-09-19T12:00:00.000Z',
      }),
    ]);

    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].entityType, 'meal_combo');
    assert.equal(result.results[0].usageCount, 7);
    assert.equal(result.results[0].calories, 275);
  });

  it('keeps unknown macros null in the normalized result', () => {
    const result = searchLocalKnowledge('birthday cake', [
      food('Birthday Cake', { calories: 450, protein: null, carbs: null, fat: null }),
    ]);

    assert.equal(result.results[0].protein, null);
    assert.equal(result.results[0].carbs, null);
    assert.equal(result.results[0].fat, null);
  });
});
