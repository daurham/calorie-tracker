import { useMemo, useState } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { calculateFromPer100g, scaleNutrition } from '@/lib/nutrition-providers';
import type { ReferenceResolveCandidate } from '@/types/quick-log-resolve';
import type { PortionReference } from '@/types/nutrition-provider';

interface ReferenceResultCardProps {
  candidate: ReferenceResolveCandidate;
  originalInput: string;
  emphasized?: boolean;
  isLogging?: boolean;
  onAdd: (candidate: ReferenceResolveCandidate) => void;
}

const formatMacros = (protein: number | null, carbs: number | null, fat: number | null) => {
  const parts = [
    protein != null ? `${protein}P` : null,
    carbs != null ? `${carbs}C` : null,
    fat != null ? `${fat}F` : null,
  ].filter(Boolean);
  return parts.join(' · ');
};

const ReferenceResultCard = ({
  candidate,
  originalInput,
  emphasized = false,
  isLogging = false,
  onAdd,
}: ReferenceResultCardProps) => {
  const [multiplier, setMultiplier] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState<PortionReference | null>(candidate.selectedPortion);

  const resolved = useMemo(() => {
    if (selectedPortion?.gramWeight && selectedPortion !== candidate.selectedPortion) {
      const grams = selectedPortion.gramWeight * (candidate.quantity || 1);
      return {
        nutrition: calculateFromPer100g(candidate.nutritionPer100g, grams),
        weightGrams: Number(grams.toFixed(2)),
        servingDescription: selectedPortion.description,
        portionResolved: true,
      };
    }
    return {
      nutrition: candidate.nutrition,
      weightGrams: candidate.weightGrams,
      servingDescription: candidate.servingDescription,
      portionResolved: candidate.portionResolved,
    };
  }, [candidate, selectedPortion]);

  const nutrition = resolved.nutrition
    ? scaleNutrition(resolved.nutrition, multiplier)
    : null;
  const grams = resolved.weightGrams != null
    ? Number((resolved.weightGrams * multiplier).toFixed(1))
    : null;
  const canAdd = nutrition != null && (resolved.portionResolved || selectedPortion?.gramWeight != null);

  return (
    <div
      className={`rounded-xl border px-3 py-3 sm:px-4 ${
        emphasized
          ? 'border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/40'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      <h3 className="font-semibold text-sm sm:text-base">{candidate.name}</h3>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
        {resolved.servingDescription || 'Choose a portion'}
        {grams != null ? ` · ${grams}g` : ''}
      </p>
      {nutrition ? (
        <p className="mt-1 text-sm">
          ~{nutrition.calories} cal
          {formatMacros(nutrition.protein, nutrition.carbs, nutrition.fat)
            ? ` · ${formatMacros(nutrition.protein, nutrition.carbs, nutrition.fat)}`
            : ''}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Select a portion to calculate nutrition.</p>
      )}

      {!resolved.portionResolved && candidate.portions.some(portion => portion.gramWeight) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {candidate.portions.filter(portion => portion.gramWeight).slice(0, 4).map(portion => (
            <Button
              key={`${portion.description}-${portion.gramWeight}`}
              type="button"
              size="sm"
              variant={selectedPortion?.description === portion.description ? 'default' : 'outline'}
              className="h-8"
              onClick={() => setSelectedPortion(portion)}
            >
              {portion.description}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setMultiplier(value => Math.max(0.25, Number((value - 0.5).toFixed(2))))}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="min-w-6 text-center text-sm">{multiplier}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setMultiplier(value => Number((value + 0.5).toFixed(2)))}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button
          size="sm"
          disabled={!canAdd || isLogging}
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => {
            if (!nutrition) return;
            onAdd({
              ...candidate,
              nutrition,
              quantity: Number((candidate.quantity * multiplier).toFixed(2)),
              weightGrams: grams,
              servingDescription: multiplier === 1
                ? resolved.servingDescription
                : `${multiplier} × ${resolved.servingDescription}`,
              selectedPortion: selectedPortion || candidate.selectedPortion,
              portionResolved: true,
            });
          }}
        >
          {isLogging ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to Today'}
        </Button>
      </div>
    </div>
  );
};

export default ReferenceResultCard;
