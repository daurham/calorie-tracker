import type { MatchClassification } from '../../types/food-search';
import { extractAttributes, isGenericQuery } from './attributes';
import { tokenize } from './normalize';
import type { ScoredCandidate } from './score';

export const classifySearchResults = (
  query: string,
  scored: ScoredCandidate[]
): MatchClassification => {
  const usable = scored.filter(item => item.matchType !== 'none' && item.score >= 0.2);
  if (usable.length === 0) return 'none';

  const compatible = usable.filter(item => item.conflicts.length === 0 && !item.queryMoreSpecific);
  const queryTokens = tokenize(query);
  const queryAttributes = extractAttributes(query);
  const generic = isGenericQuery(queryAttributes, queryTokens);
  const best = usable[0];

  if (best.matchType === 'exact' && (compatible.length <= 1 || best.score - (usable[1]?.score || 0) >= 0.08)) {
    return 'exact';
  }

  if (generic && compatible.length >= 2) {
    const close = compatible.filter(item => item.score >= compatible[0].score * 0.82);
    if (close.length >= 2) return 'ambiguous';
  }

  if (compatible.length >= 2 && Math.abs(compatible[0].score - compatible[1].score) <= 0.08) {
    return 'ambiguous';
  }

  if (best.matchType === 'exact' || best.matchType === 'strong') {
    return best.matchType;
  }

  return 'weak';
};
