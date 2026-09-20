import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import {
  formatMacroLine,
  formatUsage,
  previewScaledCandidate,
  type ParsedQuantity,
} from '@/lib/quick-log';
import type { SearchCandidate } from '@/types/food-search';

interface QuickLogResultProps {
  candidate: SearchCandidate;
  parsed: ParsedQuantity;
  emphasized?: boolean;
  isLogging?: boolean;
  onAdd: (candidate: SearchCandidate, parsed: ParsedQuantity) => void;
}

const QuickLogResult = ({
  candidate,
  parsed,
  emphasized = false,
  isLogging = false,
  onAdd,
}: QuickLogResultProps) => {
  const [expanded, setExpanded] = useState(false);
  const [override, setOverride] = useState(String(parsed.quantity));
  const quantity = expanded ? Number(override) || parsed.quantity : parsed.quantity;
  const effectiveParsed: ParsedQuantity = {
    ...parsed,
    quantity,
    canScaleByServing: parsed.canScaleByServing || expanded,
    unitKind: expanded ? 'serving' : parsed.unitKind,
  };
  const preview = previewScaledCandidate(candidate, effectiveParsed);
  const showQuantity = preview.quantity !== 1 || expanded;
  const usage = formatUsage(candidate);
  const macros = formatMacroLine({
    ...candidate,
    protein: preview.protein,
    carbs: preview.carbs,
    fat: preview.fat,
  });

  return (
    <div
      className={`rounded-xl border px-3 py-3 sm:px-4 ${
        emphasized
          ? 'border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/40'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setExpanded(current => !current)}
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="font-semibold text-sm sm:text-base">
              {candidate.name}
              {showQuantity ? ` × ${preview.quantity}` : ''}
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {preview.estimated ? '~' : ''}
            {preview.calories} cal
            {preview.servingDescription ? ` · ${preview.servingDescription}` : ''}
            {usage ? ` · ${usage}` : ''}
          </p>
          {macros && (
            <p className="mt-0.5 text-xs text-muted-foreground">{macros}</p>
          )}
        </button>
        <Button
          size="sm"
          disabled={isLogging}
          onClick={() => onAdd(candidate, effectiveParsed)}
          className="h-9 min-w-9 bg-emerald-500 px-3 hover:bg-emerald-600"
          aria-label={`Add ${candidate.name}`}
        >
          {isLogging ? <Loader2 className="h-4 w-4 animate-spin" /> : showQuantity ? 'Add' : <Plus className="h-4 w-4" />}
        </Button>
      </div>
      {expanded && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min="0.25"
            step="0.25"
            value={override}
            onChange={(event) => setOverride(event.target.value)}
            className="h-9 w-24"
            aria-label="Quantity"
          />
          <span className="text-xs text-muted-foreground">servings</span>
        </div>
      )}
    </div>
  );
};

export default QuickLogResult;
