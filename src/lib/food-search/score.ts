import type { MatchClassification, RawSearchRecord } from '../../types/food-search';
import {
  conflictingAttributes,
  extractAttributes,
  querySpecifiesMissingIdentity,
} from './attributes';
import { normalizeName, tokenize } from './normalize';

export interface ScoredCandidate {
  record: RawSearchRecord;
  normalizedName: string;
  tokens: string[];
  attributes: ReturnType<typeof extractAttributes>;
  conflicts: string[];
  queryMoreSpecific: boolean;
  identityScore: number;
  attributeScore: number;
  textScore: number;
  popularityScore: number;
  score: number;
  matchType: MatchClassification;
}

const tokenOverlap = (queryTokens: string[], candidateTokens: string[]): number => {
  if (queryTokens.length === 0 || candidateTokens.length === 0) return 0;
  const candidateSet = new Set(candidateTokens);
  const shared = queryTokens.filter(token => candidateSet.has(token)).length;
  return shared / queryTokens.length;
};

const jaccard = (queryTokens: string[], candidateTokens: string[]): number => {
  const union = new Set([...queryTokens, ...candidateTokens]);
  if (union.size === 0) return 0;
  const candidateSet = new Set(candidateTokens);
  const shared = queryTokens.filter(token => candidateSet.has(token)).length;
  return shared / union.size;
};

const prefixBonus = (query: string, candidate: string): number => {
  if (!query || !candidate) return 0;
  if (candidate.startsWith(query)) return 0.2;
  return candidate.split(' ').some(token => token.startsWith(query.split(' ')[0])) ? 0.08 : 0;
};

const popularityScore = (usageCount: number, lastUsedAt?: string | null): number => {
  const usage = Math.log10(1 + Math.max(0, usageCount)) / 4;
  if (!lastUsedAt) return Math.min(1, usage);
  const ageMs = Date.now() - new Date(lastUsedAt).getTime();
  const recency = Number.isNaN(ageMs) ? 0 : Math.max(0, 1 - ageMs / (1000 * 60 * 60 * 24 * 30));
  return Math.min(1, usage * 0.7 + recency * 0.3);
};

export const scoreCandidate = (query: string, record: RawSearchRecord): ScoredCandidate => {
  const normalizedQuery = normalizeName(query);
  const normalizedName = record.normalizedName || normalizeName(record.name);
  const queryTokens = tokenize(query);
  const candidateTokens = tokenize(record.name);
  const queryAttributes = extractAttributes(query);
  const candidateAttributes = extractAttributes(record.name, record.attributes);
  const conflicts = conflictingAttributes(queryAttributes, candidateAttributes);
  const queryMoreSpecific = querySpecifiesMissingIdentity(queryAttributes, candidateAttributes);

  const exact = normalizedQuery === normalizedName;
  const queryCovered = queryTokens.length > 0 && queryTokens.every(token => candidateTokens.includes(token));
  const overlap = tokenOverlap(queryTokens, candidateTokens);

  let identityScore = 0;
  if (exact) identityScore = 1;
  else if (queryCovered) identityScore = 0.9;
  else identityScore = overlap;

  let attributeScore = 1;
  if (conflicts.length > 0) {
    identityScore *= 0.15;
    attributeScore = 0;
  } else if (queryMoreSpecific) {
    identityScore *= 0.45;
    attributeScore = 0.25;
  } else if (queryCovered && candidateTokens.length > queryTokens.length) {
    attributeScore = 0.85;
  }

  const textScore = Math.min(1, jaccard(queryTokens, candidateTokens) + prefixBonus(normalizedQuery, normalizedName));
  const popScore = popularityScore(record.usageCount || 0, record.lastUsedAt);

  let score = Number((
    identityScore * 0.55 +
    attributeScore * 0.25 +
    textScore * 0.15 +
    popScore * 0.05
  ).toFixed(4));

  let matchType: MatchClassification = 'none';
  if (exact && conflicts.length === 0) {
    matchType = 'exact';
    score = Math.max(score, 0.96);
  } else if (conflicts.length > 0 || queryMoreSpecific) {
    matchType = score >= 0.2 ? 'weak' : 'none';
    score = Math.min(score, 0.44);
  } else if (queryCovered && score >= 0.7) {
    matchType = 'strong';
  } else if (score >= 0.28) {
    matchType = 'weak';
  }

  return {
    record,
    normalizedName,
    tokens: candidateTokens,
    attributes: candidateAttributes,
    conflicts,
    queryMoreSpecific,
    identityScore,
    attributeScore,
    textScore,
    popularityScore: popScore,
    score,
    matchType,
  };
};
