import type { MatchClassification } from '../../../types/food-search.js';
import type { NutritionCandidate } from '../../../types/nutrition-provider.js';
import { extractAttributes, preparationsConflict } from '../../food-search/attributes.js';
import { normalizeName, tokenize } from '../../food-search/normalize.js';
import { isCompleteEnough } from '../math.js';

const DISTRACTORS = new Set([
  'bread', 'chip', 'juice', 'yogurt', 'smoothie', 'muffin', 'cake', 'candy',
  'cereal', 'bar', 'pudding', 'ice', 'cream', 'sauce', 'soup', 'nugget',
]);

const GENERIC_TYPES = new Set(['Foundation', 'SR Legacy', 'Survey (FNDDS)']);

export interface RankedUsdaCandidate {
  candidate: NutritionCandidate;
  score: number;
  matchType: MatchClassification;
  conflicts: string[];
}

const tokenCoverage = (queryTokens: string[], candidateTokens: string[]) => {
  if (queryTokens.length === 0) return 0;
  const candidateSet = new Set(candidateTokens);
  return queryTokens.filter(token => candidateSet.has(token)).length / queryTokens.length;
};

export const rankUsdaCandidates = (
  query: string,
  candidates: NutritionCandidate[]
): RankedUsdaCandidate[] => {
  const queryTokens = tokenize(query);
  const queryAttributes = extractAttributes(query);
  const genericQuery = queryTokens.length <= 2 && !queryAttributes.preparation;

  return candidates.map(candidate => {
    const candidateTokens = tokenize(candidate.name);
    const candidateAttributes = extractAttributes(candidate.name);
    const coverage = tokenCoverage(queryTokens, candidateTokens);
    const extraDistractor = candidateTokens.some(token => DISTRACTORS.has(token) && !queryTokens.includes(token));
    const conflicts: string[] = [];

    if (queryAttributes.preparation && candidateAttributes.preparation
      && preparationsConflict(queryAttributes.preparation, candidateAttributes.preparation)) {
      conflicts.push('preparation');
    }
    if (queryAttributes.protein && candidateAttributes.protein
      && queryAttributes.protein !== candidateAttributes.protein) {
      conflicts.push('protein');
    }
    if (queryAttributes.skin && candidateAttributes.skin && queryAttributes.skin !== candidateAttributes.skin) {
      conflicts.push('skin');
    }

    const complete = isCompleteEnough(candidate.nutritionPer100g);
    const genericType = GENERIC_TYPES.has(candidate.metadata?.dataType || '');
    const branded = candidate.metadata?.dataType === 'Branded' || Boolean(candidate.metadata?.brandOwner);
    const hasPortions = candidate.portions.some(portion => portion.gramWeight != null);

    let identity = coverage;
    if (normalizeName(query) === normalizeName(candidate.name)) identity = 1;
    if (extraDistractor) identity *= 0.25;

    let score = (
      identity * 0.46 +
      (conflicts.length === 0 ? 0.22 : 0) +
      (genericQuery && genericType ? 0.14 : branded ? 0.02 : 0.08) +
      (complete ? 0.1 : 0) +
      (hasPortions ? 0.08 : 0.02)
    );

    if (!complete) score *= 0.35;
    if (conflicts.length > 0) score = Math.min(score, 0.38);
    if (extraDistractor) score = Math.min(score, 0.42);

    let matchType: MatchClassification = 'none';
    if (!complete) matchType = 'none';
    else if (conflicts.length > 0 || extraDistractor) matchType = score >= 0.2 ? 'weak' : 'none';
    else if (coverage >= 0.99 && score >= 0.72) matchType = 'exact';
    else if (coverage >= 0.7 && score >= 0.58) matchType = 'strong';
    else if (score >= 0.28) matchType = 'weak';

    return {
      candidate,
      score: Number(score.toFixed(4)),
      matchType,
      conflicts,
    };
  }).sort((left, right) => right.score - left.score);
};

export const classifyUsdaRanking = (ranked: RankedUsdaCandidate[]): MatchClassification => {
  const usable = ranked.filter(item => item.matchType !== 'none' && isCompleteEnough(item.candidate.nutritionPer100g));
  if (usable.length === 0) return 'none';

  const best = usable[0];
  const next = usable[1];
  if (best.conflicts.length > 0) return 'weak';
  if (best.matchType === 'exact' && (!next || best.score - next.score >= 0.08)) return 'exact';
  if (next && next.matchType !== 'none' && Math.abs(best.score - next.score) <= 0.06 && next.conflicts.length === 0) {
    const differentIdentity = normalizeName(best.candidate.name) !== normalizeName(next.candidate.name);
    if (differentIdentity) return 'ambiguous';
  }
  if (best.matchType === 'exact' || best.matchType === 'strong') return best.matchType;
  return best.matchType;
};
