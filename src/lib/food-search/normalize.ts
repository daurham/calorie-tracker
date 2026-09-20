const PHRASE_SYNONYMS: Array<[RegExp, string]> = [
  [/\bfat[\s-]?free\b/g, 'skim'],
  [/\bnon[\s-]?fat\b/g, 'skim'],
  [/\bzero[\s-]?sugar\b/g, 'diet'],
  [/\bsugar[\s-]?free\b/g, 'diet'],
];

const TOKEN_SYNONYMS: Record<string, string> = {
  cola: 'coke',
  nonfat: 'skim',
  tamales: 'tamale',
};

const STOP_WORDS = new Set(['a', 'an', 'the', 'of', 'with', 'and', 'or', 'in', 'on']);

export const normalizeName = (value: string): string => {
  let next = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  for (const [pattern, replacement] of PHRASE_SYNONYMS) {
    next = next.replace(pattern, replacement);
  }
  return next
    .replace(/[^a-z0-9%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const singularize = (token: string): string => {
  if (TOKEN_SYNONYMS[token]) return TOKEN_SYNONYMS[token];
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('ses')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
};

export const tokenize = (value: string): string[] => {
  return normalizeName(value)
    .split(' ')
    .filter(Boolean)
    .map(singularize)
    .filter(token => !STOP_WORDS.has(token));
};

export const significantTokens = (tokens: string[]): string[] =>
  tokens.filter(token => token.length >= 2 || /\d/.test(token));
