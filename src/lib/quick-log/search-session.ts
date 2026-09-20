import type { MatchClassification } from '../../types/food-search';

export const SEARCH_DEBOUNCE_MS = 200;

export const createSearchRequestGuard = () => {
  let currentId = 0;
  return {
    nextId: () => {
      currentId += 1;
      return currentId;
    },
    isCurrent: (requestId: number) => requestId === currentId,
    cancel: () => {
      currentId += 1;
    },
  };
};

export const shouldApplySearchResult = (requestId: number, latestId: number) =>
  requestId === latestId;

export const shouldAutoLog = (_classification: MatchClassification) => false;
