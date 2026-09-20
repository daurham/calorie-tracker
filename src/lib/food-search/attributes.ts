import type { FoodAttributes } from '../../types/food-search';
import { tokenize } from './normalize';

const PROTEINS = new Set([
  'chicken', 'pork', 'beef', 'turkey', 'ham', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu', 'steak',
]);

const PREPARATIONS = new Set([
  'fried', 'grilled', 'baked', 'steamed', 'roasted', 'sauteed', 'raw', 'boiled',
  'cooked', 'dry', 'uncooked',
]);

const RAW_PREP = new Set(['raw', 'dry', 'uncooked']);
const COOKED_PREP = new Set(['cooked', 'fried', 'grilled', 'baked', 'steamed', 'roasted', 'sauteed', 'boiled']);

const SIZES = new Set(['small', 'medium', 'large', 'xl', 'mini']);

const MILK_FATS: Record<string, string> = {
  skim: 'skim',
  nonfat: 'skim',
  whole: 'whole',
  '1%': '1%',
  '2%': '2%',
};

const SWEETNESS = new Set(['diet', 'zero']);

const IDENTITY_KEYS = ['protein', 'filling', 'preparation', 'size', 'milk_fat', 'sweetness', 'skin'] as const;

export const extractAttributes = (
  name: string,
  stored?: FoodAttributes
): FoodAttributes => {
  const tokens = tokenize(name);
  const attributes: FoodAttributes = { ...(stored || {}) };

  for (const token of tokens) {
    if (PROTEINS.has(token)) {
      attributes.protein = attributes.protein || token;
      attributes.filling = attributes.filling || token;
    } else if (PREPARATIONS.has(token)) {
      if (!attributes.preparation || attributes.preparation === 'cooked') {
        attributes.preparation = token;
      }
    } else if (SIZES.has(token)) {
      attributes.size = attributes.size || token;
    } else if (MILK_FATS[token]) {
      attributes.milk_fat = attributes.milk_fat || MILK_FATS[token];
    } else if (SWEETNESS.has(token)) {
      attributes.sweetness = attributes.sweetness || 'diet';
    } else if (token === 'skinless') {
      attributes.skin = attributes.skin || 'none';
    }
  }

  if (/\bwithout skin\b|\bmeat only\b/i.test(name)) {
    attributes.skin = attributes.skin || 'none';
  } else if (/\bwith skin\b|\bskin on\b/i.test(name)) {
    attributes.skin = attributes.skin || 'on';
  }

  const familyTokens = tokens.filter(token => (
    !PROTEINS.has(token) &&
    !PREPARATIONS.has(token) &&
    !SIZES.has(token) &&
    !MILK_FATS[token] &&
    !SWEETNESS.has(token)
  ));

  if (!attributes.food_family) {
    attributes.food_family = familyTokens[familyTokens.length - 1] || tokens[tokens.length - 1];
  }

  return attributes;
};

export const preparationsConflict = (query?: string, candidate?: string): boolean => {
  if (!query || !candidate || query === candidate) return false;
  if (RAW_PREP.has(query) && COOKED_PREP.has(candidate)) return true;
  if (COOKED_PREP.has(query) && RAW_PREP.has(candidate)) return true;
  if ((query === 'cooked' && COOKED_PREP.has(candidate)) || (candidate === 'cooked' && COOKED_PREP.has(query))) {
    return false;
  }
  return query !== candidate;
};

export const conflictingAttributes = (
  query: FoodAttributes,
  candidate: FoodAttributes
): string[] => {
  return IDENTITY_KEYS.filter(key => {
    const queryValue = query[key];
    const candidateValue = candidate[key];
    if (!queryValue || !candidateValue) return false;
    if (key === 'preparation') return preparationsConflict(queryValue, candidateValue);
    return queryValue !== candidateValue;
  });
};

export const querySpecifiesMissingIdentity = (
  query: FoodAttributes,
  candidate: FoodAttributes
): boolean => {
  const sameFamily = !query.food_family || !candidate.food_family || query.food_family === candidate.food_family;
  if (!sameFamily) return false;
  return IDENTITY_KEYS.some(key => Boolean(query[key] && !candidate[key]));
};

export const isGenericQuery = (query: FoodAttributes, tokens: string[]): boolean => {
  const hasIdentity = IDENTITY_KEYS.some(key => Boolean(query[key]));
  return !hasIdentity || tokens.length === 1;
};
