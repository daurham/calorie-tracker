import { useEffect, useRef, useState } from 'react';
import { Barcode, Camera, Flame, Search, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';
import { useQuickLogSearch } from '@/hooks/useQuickLogSearch';
import { estimateFoodRequest } from '@/lib/food-estimate/api-client';
import { draftToCreateRequest } from '@/lib/food-estimate/log';
import { candidateKey, candidateToFoodLogInput, referenceCandidateToFoodLogInput, resolveQuickLogRequest } from '@/lib/quick-log';
import type { CreateFoodLogsRequest, FoodLogInput } from '@/types/food-log';
import type { EstimateDraft } from '@/types/food-interpretation';
import type { SearchCandidate } from '@/types/food-search';
import type { ReferenceResolveCandidate, ResolveOutcome } from '@/types/quick-log-resolve';
import { EstimateReviewDialog } from './EstimateReview';
import { MultiFoodReviewDialog } from './MultiFoodReview';
import PackagedFoodFlow from './PackagedFoodFlow';
import PhotoEstimateFlow from './PhotoEstimateFlow';
import QuickCaloriesDialog from './QuickCaloriesDialog';
import QuickLogResult from './QuickLogResult';
import ReferenceResultCard from './ReferenceResultCard';

interface QuickLogProps {
  onLog: (input: FoodLogInput) => Promise<unknown>;
  onLogGroup?: (payload: CreateFoodLogsRequest) => Promise<unknown>;
}

type ReferenceState =
  | { status: 'idle' }
  | { status: 'resolving' }
  | { status: 'result'; outcome: ResolveOutcome }
  | { status: 'error'; message: string };

const QuickLog = ({ onLog, onLogGroup }: QuickLogProps) => {
  const { query, setQuery, parsed, state, setLogging, markSuccess, markError } = useQuickLogSearch();
  const [caloriesOpen, setCaloriesOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [reference, setReference] = useState<ReferenceState>({ status: 'idle' });
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<EstimateDraft | null>(null);
  const [estimateError, setEstimateError] = useState<{ message: string; code?: string } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSavingEstimate, setIsSavingEstimate] = useState(false);
  const estimateInFlight = useRef(false);

  useEffect(() => {
    setReference({ status: 'idle' });
    setEstimate(null);
    setEstimateError(null);
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const localNeedsReference = hasQuery
    && (state.status === 'matches' || state.status === 'error' || state.status === 'idle')
    && (state.classification === 'none' || state.classification === 'weak' || (state.classification == null && state.results.length === 0));

  const showSearchDatabase = localNeedsReference
    && state.status !== 'searching'
    && reference.status === 'idle';
  const textActionsDisabled = !hasQuery || isEstimating || reference.status === 'resolving';

  const handleAddLocal = async (candidate: SearchCandidate, nextParsed = parsed) => {
    const key = candidateKey(candidate);
    setLogging(key);
    try {
      await onLog(candidateToFoodLogInput(candidate, {
        parsed: nextParsed,
        originalInput: query || candidate.name,
      }));
      markSuccess();
    } catch (error) {
      markError(error instanceof Error ? error.message : 'Could not add food');
    }
  };

  const handleAddReference = async (candidate: ReferenceResolveCandidate) => {
    setLoggingKey(candidate.externalId);
    try {
      await onLog(referenceCandidateToFoodLogInput(candidate, query || candidate.name));
      markSuccess();
      setReference({ status: 'idle' });
    } catch (error) {
      markError(error instanceof Error ? error.message : 'Could not add food');
    } finally {
      setLoggingKey(null);
    }
  };

  const handleEstimate = async () => {
    if (!query.trim() || isEstimating || estimateInFlight.current) return;
    estimateInFlight.current = true;
    setIsEstimating(true);
    setEstimateError(null);
    try {
      const outcome = await estimateFoodRequest({ text: query.trim() });
      if (outcome.status === 'error') {
        setEstimateError({
          message: outcome.code === 'timeout'
            ? 'That estimate took too long. Try again.'
            : outcome.message,
          code: outcome.code,
        });
        return;
      }
      setEstimate(outcome.draft);
    } catch (error) {
      setEstimateError({
        message: error instanceof Error ? error.message : "Couldn't estimate this food.",
      });
    } finally {
      estimateInFlight.current = false;
      setIsEstimating(false);
    }
  };

  const handleAddDraft = async (draft: EstimateDraft) => {
    setIsSavingEstimate(true);
    try {
      const payload = draftToCreateRequest(draft);
      if (payload.logs.length > 1 && onLogGroup) {
        await onLogGroup(payload);
      } else {
        for (const log of payload.logs) {
          await onLog(log);
        }
      }
      markSuccess();
      setEstimate(null);
      setQuery('');
    } catch (error) {
      markError(error instanceof Error ? error.message : 'Could not add food');
    } finally {
      setIsSavingEstimate(false);
    }
  };

  const handleResolve = async () => {
    if (!query.trim() || reference.status === 'resolving') return;
    setReference({ status: 'resolving' });
    try {
      const outcome = await resolveQuickLogRequest(query.trim());
      if (outcome.status === 'unresolved') {
        setReference({ status: 'error', message: outcome.message });
        return;
      }
      setReference({ status: 'result', outcome });
    } catch (error) {
      setReference({
        status: 'error',
        message: error instanceof Error ? error.message : "Couldn't search reference nutrition.",
      });
    }
  };

  const showResults = query.trim().length > 0 && (state.status === 'searching' || state.status === 'matches' || state.status === 'ambiguous' || state.status === 'logging' || state.status === 'error');
  const exactId = state.classification === 'exact' || state.classification === 'strong'
    ? state.results[0]
    : null;

  return (
    <>
      <Card className="mb-4 sm:mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-emerald-200 dark:border-emerald-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Quick Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (hasQuery) {
                void handleResolve();
              }
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="What did you eat?"
                className="h-12 rounded-xl border-slate-300 pl-10 text-base shadow-inner dark:border-slate-600"
                autoComplete="off"
                enterKeyHint="search"
                disabled={reference.status === 'resolving'}
              />
            </div>
          </form>

          {state.status === 'success' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Added to Today.</p>
          )}

          {showResults && reference.status === 'idle' && (
            <div className="space-y-2">
              {state.status === 'searching' && state.results.length === 0 && (
                <p className="text-sm text-muted-foreground">Searching your foods…</p>
              )}
              {state.status === 'error' && (
                <p className="text-sm text-red-500">{state.error}</p>
              )}
              {state.results.length === 0 && state.status !== 'searching' && state.status !== 'error' && !showSearchDatabase && (
                <p className="text-sm text-muted-foreground">No saved match</p>
              )}
              {state.classification === 'weak' && state.results.length > 0 && (
                <p className="text-xs text-muted-foreground">Weak saved matches. You can add one or search the nutrition database.</p>
              )}
              {state.classification === 'ambiguous' && state.results.length > 1 && (
                <p className="text-xs text-muted-foreground">Multiple matches. Choose one to add.</p>
              )}
              {state.results.map((candidate) => (
                <QuickLogResult
                  key={candidateKey(candidate)}
                  candidate={candidate}
                  parsed={parsed}
                  emphasized={exactId ? candidateKey(candidate) === candidateKey(exactId) : false}
                  isLogging={state.loggingKey === candidateKey(candidate)}
                  onAdd={handleAddLocal}
                />
              ))}
            </div>
          )}

          {showSearchDatabase && state.results.length === 0 && state.status !== 'error' && (
            <p className="text-sm text-muted-foreground">No saved match</p>
          )}

          {reference.status === 'resolving' && (
            <p className="text-sm text-muted-foreground">Searching nutrition...</p>
          )}

          {reference.status === 'error' && !estimate && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No saved/reference match</p>
              <p className="text-sm text-red-500">{reference.message}</p>
              <Button type="button" variant="outline" className="w-full" onClick={() => void handleResolve()}>
                Retry
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setCaloriesOpen(true)}>
                Calories
              </Button>
            </div>
          )}

          {estimateError && (
            <div className="space-y-2">
              <p className="text-sm text-red-500">{estimateError.message}</p>
              {estimateError.code !== 'budget_exhausted' && (
                <Button type="button" variant="outline" className="w-full" onClick={() => void handleEstimate()}>
                  Retry
                </Button>
              )}
              <Button type="button" variant="outline" className="w-full" onClick={() => setCaloriesOpen(true)}>
                Calories
              </Button>
            </div>
          )}

          {reference.status === 'result' && reference.outcome.status === 'local' && (
            <div className="space-y-2">
              {reference.outcome.results.map((candidate) => (
                <QuickLogResult
                  key={candidateKey(candidate)}
                  candidate={candidate}
                  parsed={parsed}
                  onAdd={handleAddLocal}
                />
              ))}
            </div>
          )}

          {reference.status === 'result' && reference.outcome.status === 'reference' && (
            <div className="space-y-2">
              {reference.outcome.classification === 'ambiguous' && (
                <p className="text-xs text-muted-foreground">Several reference matches. Choose one.</p>
              )}
              {reference.outcome.results.map((candidate, index) => (
                <ReferenceResultCard
                  key={candidate.externalId}
                  candidate={candidate}
                  originalInput={query}
                  emphasized={index === 0 && reference.outcome.classification !== 'ambiguous'}
                  isLogging={loggingKey === candidate.externalId}
                  onAdd={handleAddReference}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Search nutrition database"
              title={hasQuery ? 'Search nutrition database' : 'Type a food first'}
              className="h-9 justify-center border-emerald-200 text-xs sm:text-sm hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
              onClick={() => void handleResolve()}
              disabled={textActionsDisabled}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="truncate">Search nutrition</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Estimate this food"
              title={hasQuery ? 'Estimate this food' : 'Type a food first'}
              className="h-9 justify-center text-xs sm:text-sm"
              onClick={() => void handleEstimate()}
              disabled={textActionsDisabled}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="truncate">{isEstimating ? 'Estimating…' : 'Estimate'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhotoOpen(true)}
              aria-label="Photo"
              className="h-11 justify-center border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Photo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBarcodeOpen(true)}
              aria-label="Barcode"
              className="h-11 justify-center border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
            >
              <Barcode className="h-4 w-4" />
              <span className="hidden sm:inline">Barcode</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCaloriesOpen(true)}
              aria-label="Calories"
              className="h-11 justify-center border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
            >
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Calories</span>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Photo, barcode, and calories are ready. Estimates are reviewed before they are added.
          </p>
        </CardContent>
      </Card>

      <PackagedFoodFlow
        open={barcodeOpen}
        onOpenChange={setBarcodeOpen}
        onAdd={async (input) => {
          await onLog(input);
          markSuccess();
        }}
      />
      <PhotoEstimateFlow
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        onDraft={setEstimate}
        onError={(message, code) => setEstimateError({ message, code })}
      />
      {estimate && estimate.items.length <= 1 && (
        <EstimateReviewDialog
          open
          onOpenChange={(open) => { if (!open) setEstimate(null); }}
          draft={estimate}
          onChange={setEstimate}
          onAdd={() => void handleAddDraft(estimate)}
          isSaving={isSavingEstimate}
        />
      )}
      {estimate && estimate.items.length > 1 && (
        <MultiFoodReviewDialog
          open
          onOpenChange={(open) => { if (!open) setEstimate(null); }}
          draft={estimate}
          onChange={setEstimate}
          onAdd={() => void handleAddDraft(estimate)}
          onAddItem={(item) => void handleAddDraft({
            ...estimate,
            displayName: item.name,
            items: [item],
          })}
          isSaving={isSavingEstimate}
        />
      )}
      <QuickCaloriesDialog
        open={caloriesOpen}
        onOpenChange={setCaloriesOpen}
        onAdd={onLog}
      />
    </>
  );
};

export default QuickLog;
