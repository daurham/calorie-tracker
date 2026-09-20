import type { FoodLogInput } from '../../types/food-log.js';
import type { ReferenceResolveCandidate } from '../../types/quick-log-resolve.js';

export const referenceCandidateToFoodLogInput = (
  candidate: ReferenceResolveCandidate,
  originalInput: string
): FoodLogInput => {
  const calories = candidate.nutrition?.calories;
  if (calories == null) {
    throw new Error('Reference nutrition is missing calories');
  }

  const fdcId = Number(candidate.externalId);

  return {
    display_name: candidate.name,
    source_type: 'usda',
    source_id: Number.isFinite(fdcId) ? fdcId : null,
    nutrition_source: 'usda',
    quantity: candidate.quantity,
    serving_description: candidate.servingDescription,
    weight_grams: candidate.weightGrams,
    calories,
    protein: candidate.nutrition?.protein ?? null,
    carbs: candidate.nutrition?.carbs ?? null,
    fat: candidate.nutrition?.fat ?? null,
    confidence: candidate.confidence,
    original_input: originalInput,
    metadata: {
      provider: 'usda',
      externalId: candidate.externalId,
      referenceDescription: candidate.metadata?.description || candidate.name,
      referenceGrams: candidate.weightGrams,
      originalInput,
      dataType: candidate.metadata?.dataType,
      portionResolved: candidate.portionResolved,
    },
  };
};

export const createsCanonicalFoodFromReference = () => false;
