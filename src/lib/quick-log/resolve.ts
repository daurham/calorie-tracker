import type { FoodSearchResponse } from '../../types/food-search';
import type { NutritionProvider } from '../../types/nutrition-provider';
import { ProviderError } from '../../types/nutrition-provider';
import type {
  QuickLogResolveRequest,
  ReferenceResolveCandidate,
  ResolveOutcome,
} from '../../types/quick-log-resolve';
import { applyParsedQuantityToCandidate } from '../nutrition-providers/math';
import { classifyUsdaRanking, rankUsdaCandidates } from '../nutrition-providers/usda/rank';
import { parseQuantityQuery } from './quantity';

export interface ResolveDependencies {
  searchLocal: (query: string) => FoodSearchResponse | Promise<FoodSearchResponse>;
  provider?: NutritionProvider | null;
}

const LOCAL_WINS = new Set(['exact', 'strong', 'ambiguous']);

const providerMessage = (error: ProviderError) => {
  if (error.code === 'missing_key' || error.code === 'timeout' || error.code === 'provider_error' || error.code === 'malformed') {
    return "Couldn't search reference nutrition.";
  }
  return error.message;
};

const toReferenceCandidate = (
  ranked: ReturnType<typeof rankUsdaCandidates>[number],
  parsed: ReturnType<typeof parseQuantityQuery>
): ReferenceResolveCandidate | null => {
  const applied = applyParsedQuantityToCandidate(ranked.candidate, parsed);
  if (applied.nutrition == null && applied.portionResolved) return null;
  if (applied.nutrition == null && ranked.candidate.nutritionPer100g.calories == null) return null;

  const confidence = applied.portionResolved && ranked.conflicts.length === 0 && (ranked.matchType === 'exact' || ranked.matchType === 'strong')
    ? 'high'
    : applied.portionResolved && ranked.conflicts.length === 0
      ? 'medium'
      : 'low';

  return {
    ...ranked.candidate,
    nutrition: applied.nutrition,
    selectedPortion: applied.selectedPortion,
    weightGrams: applied.weightGrams,
    quantity: applied.quantity,
    servingDescription: applied.servingDescription,
    portionResolved: applied.portionResolved,
    confidence,
    match: {
      score: ranked.score,
      type: ranked.matchType,
      conflicts: ranked.conflicts,
    },
  };
};

export const resolveQuickLog = async (
  request: QuickLogResolveRequest,
  deps: ResolveDependencies
): Promise<ResolveOutcome> => {
  const text = request.input?.text?.trim() || '';
  if (!text) {
    return {
      status: 'unresolved',
      classification: 'none',
      results: [],
      usedUsda: false,
      error: 'no_match',
      message: 'Enter a food to resolve.',
    };
  }

  const parsed = parseQuantityQuery(text);
  const localQuery = parsed.foodQuery || text;

  let local: FoodSearchResponse;
  try {
    local = await deps.searchLocal(localQuery);
  } catch (error) {
    return {
      status: 'unresolved',
      classification: 'none',
      results: [],
      usedUsda: false,
      error: 'local_error',
      message: error instanceof Error ? error.message : 'Could not search saved foods.',
    };
  }

  if (LOCAL_WINS.has(local.classification)) {
    return {
      status: 'local',
      classification: local.classification,
      results: local.results,
      usedUsda: false,
    };
  }

  if (!deps.provider) {
    return {
      status: 'unresolved',
      classification: local.classification === 'weak' ? 'weak' : 'none',
      results: [],
      usedUsda: false,
      error: 'no_match',
      message: 'No saved match.',
    };
  }

  try {
    const usdaResults = await deps.provider.search(localQuery);
    const ranked = rankUsdaCandidates(localQuery, usdaResults);
    const classification = classifyUsdaRanking(ranked);
    const mapped = ranked
      .map(item => toReferenceCandidate(item, parsed))
      .filter((item): item is ReferenceResolveCandidate => item != null)
      .filter(item => item.match.type !== 'none');

    if (mapped.length === 0 || classification === 'none') {
      return {
        status: 'unresolved',
        classification: 'none',
        results: [],
        usedUsda: true,
        error: 'no_match',
        message: 'No reliable reference nutrition found.',
      };
    }

    const usable = mapped.filter(item => item.nutrition != null || item.portions.some(portion => portion.gramWeight != null));
    if (usable.length === 0) {
      return {
        status: 'unresolved',
        classification: 'none',
        results: [],
        usedUsda: true,
        error: 'incomplete',
        message: 'No reliable reference nutrition found.',
      };
    }

    return {
      status: 'reference',
      classification,
      results: usable.slice(0, 8),
      usedUsda: true,
    };
  } catch (error) {
    const providerError = error instanceof ProviderError
      ? error
      : new ProviderError('provider_error', error instanceof Error ? error.message : 'USDA request failed');
    return {
      status: 'unresolved',
      classification: 'none',
      results: [],
      usedUsda: true,
      error: providerError.code,
      message: providerMessage(providerError),
    };
  }
};
