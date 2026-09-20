import { useEffect, useMemo, useRef, useState } from 'react';
import { searchFoods } from '@/lib/food-search';
import {
  SEARCH_DEBOUNCE_MS,
  createSearchRequestGuard,
  initialQuickLogState,
  parseQuantityQuery,
  statusFromClassification,
  type QuickLogViewState,
} from '@/lib/quick-log';

export function useQuickLogSearch() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<QuickLogViewState>(initialQuickLogState);
  const guardRef = useRef(createSearchRequestGuard());

  const parsed = useMemo(() => parseQuantityQuery(query), [query]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      guardRef.current.cancel();
      setState(initialQuickLogState);
      return;
    }

    const requestId = guardRef.current.nextId();
    setState(prev => ({
      ...prev,
      status: 'searching',
      query: trimmed,
      error: null,
    }));

    const timeout = window.setTimeout(async () => {
      try {
        const response = await searchFoods(parsed.foodQuery || trimmed);
        if (!guardRef.current.isCurrent(requestId)) return;
        setState({
          status: statusFromClassification(response.classification),
          query: trimmed,
          results: response.results,
          classification: response.classification,
          error: null,
          loggingKey: null,
        });
      } catch (error) {
        if (!guardRef.current.isCurrent(requestId)) return;
        setState({
          status: 'error',
          query: trimmed,
          results: [],
          classification: null,
          error: error instanceof Error ? error.message : 'Search failed',
          loggingKey: null,
        });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [parsed.foodQuery, query]);

  const setLogging = (loggingKey: string | null) => {
    setState(prev => ({
      ...prev,
      status: loggingKey ? 'logging' : prev.results.length > 1 && prev.classification === 'ambiguous' ? 'ambiguous' : prev.results.length ? 'matches' : 'idle',
      loggingKey,
    }));
  };

  const markSuccess = () => {
    setQuery('');
    setState({
      ...initialQuickLogState,
      status: 'success',
    });
    window.setTimeout(() => {
      setState(prev => prev.status === 'success' ? initialQuickLogState : prev);
    }, 1200);
  };

  const markError = (message: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error: message,
      loggingKey: null,
    }));
  };

  return {
    query,
    setQuery,
    parsed,
    state,
    setLogging,
    markSuccess,
    markError,
  };
}
