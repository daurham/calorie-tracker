import type { SearchCandidate } from '../../types/food-search.js';
import type { ParsedQuantity } from './quantity.js';
import { scaleCandidateNutrition } from './scale.js';

export const isEstimatedCandidate = (candidate: SearchCandidate) => {
  if (candidate.confidence === 'verified' || candidate.confidence === 'high') return false;
  return candidate.source === 'previous_log' || candidate.confidence === 'medium' || candidate.confidence === 'low';
};

export const formatMacroLine = (candidate: SearchCandidate) => {
  const parts = [
    candidate.protein != null ? `${candidate.protein}p` : null,
    candidate.carbs != null ? `${candidate.carbs}c` : null,
    candidate.fat != null ? `${candidate.fat}f` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
};

export const formatUsage = (candidate: SearchCandidate) => {
  if (candidate.usageCount >= 2) return `Logged ${candidate.usageCount}x`;
  if (candidate.lastUsedAt) return 'Recent';
  return null;
};

export const previewScaledCandidate = (candidate: SearchCandidate, parsed: ParsedQuantity) => {
  const scaled = scaleCandidateNutrition(candidate, parsed);
  return {
    calories: scaled.nutrition.calories,
    protein: scaled.nutrition.protein,
    carbs: scaled.nutrition.carbs,
    fat: scaled.nutrition.fat,
    quantity: scaled.quantity,
    servingDescription: scaled.servingDescription,
    scaled: scaled.scaled,
    estimated: isEstimatedCandidate(candidate),
  };
};
