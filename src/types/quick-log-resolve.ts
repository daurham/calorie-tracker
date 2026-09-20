import type { NutritionConfidence } from './food-log';
import type { MatchClassification, SearchCandidate } from './food-search';
import type { NutritionCandidate, NutritionReference, PortionReference } from './nutrition-provider';

export interface QuickLogResolveRequest {
  input: {
    type: 'text';
    text: string;
  };
}

export interface ReferenceResolveCandidate extends NutritionReference {
  match: {
    score: number;
    type: MatchClassification;
    conflicts: string[];
  };
}

export type ResolveErrorCode =
  | 'missing_key'
  | 'timeout'
  | 'provider_error'
  | 'malformed'
  | 'no_match'
  | 'incomplete'
  | 'local_error';

export type ResolveOutcome =
  | {
      status: 'local';
      classification: MatchClassification;
      results: SearchCandidate[];
      usedUsda: false;
    }
  | {
      status: 'reference';
      classification: MatchClassification;
      results: ReferenceResolveCandidate[];
      usedUsda: true;
    }
  | {
      status: 'unresolved';
      classification: 'none' | 'weak';
      results: [];
      usedUsda: boolean;
      error: ResolveErrorCode;
      message: string;
    };

export interface AppliedReferencePortion {
  candidate: NutritionCandidate;
  nutrition: {
    calories: number;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  quantity: number;
  weightGrams: number | null;
  servingDescription: string | null;
  selectedPortion: PortionReference | null;
  portionResolved: boolean;
  confidence: NutritionConfidence;
}
