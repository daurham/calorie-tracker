import type { MatchClassification, SearchCandidate } from '../../types/food-search';

export type QuickLogStatus =
  | 'idle'
  | 'searching'
  | 'matches'
  | 'ambiguous'
  | 'logging'
  | 'success'
  | 'error';

export interface QuickLogViewState {
  status: QuickLogStatus;
  query: string;
  results: SearchCandidate[];
  classification: MatchClassification | null;
  error: string | null;
  loggingKey: string | null;
}

export const initialQuickLogState: QuickLogViewState = {
  status: 'idle',
  query: '',
  results: [],
  classification: null,
  error: null,
  loggingKey: null,
};

export const candidateKey = (candidate: Pick<SearchCandidate, 'entityType' | 'id'>) =>
  `${candidate.entityType}:${candidate.id}`;

export const statusFromClassification = (
  classification: MatchClassification
): Extract<QuickLogStatus, 'matches' | 'ambiguous'> => {
  if (classification === 'ambiguous') return 'ambiguous';
  return 'matches';
};
