import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label } from '@/components/ui';
import { formatApproxCalories } from '@/lib/food-estimate/validate';
import { draftTotals, scaleEstimateItem } from '@/lib/food-estimate/scale-draft';
import type { EstimateDraft, EstimateItem } from '@/types/food-interpretation';

interface EstimateReviewProps {
  draft: EstimateDraft;
  onChange: (draft: EstimateDraft) => void;
  onAdd: () => void;
  isSaving?: boolean;
}

const macroLine = (item: EstimateItem) => {
  const parts = [
    item.nutrition.protein != null ? `${item.nutrition.protein}P` : null,
    item.nutrition.carbs != null ? `${item.nutrition.carbs}C` : null,
    item.nutrition.fat != null ? `${item.nutrition.fat}F` : null,
  ].filter(Boolean);
  return parts.join(' · ');
};

const EstimateReview = ({ draft, onChange, onAdd, isSaving }: EstimateReviewProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const totals = draftTotals(draft.items);
  const estimated = totals.estimated || draft.usedGemini;

  const updateItem = (id: string, next: EstimateItem) => {
    onChange({ ...draft, items: draft.items.map(item => (item.id === id ? next : item)) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{draft.displayName}</h3>
        <p className="text-base font-medium">
          {formatApproxCalories(totals.calories, estimated)} cal
          {macroLine({ ...draft.items[0], nutrition: totals } as EstimateItem) && (
            <span className="text-sm text-muted-foreground"> · {macroLine({ ...draft.items[0], nutrition: totals } as EstimateItem)}</span>
          )}
        </p>
        {totals.calorieLow != null && totals.calorieHigh != null && (
          <p className="text-sm text-muted-foreground">Likely {totals.calorieLow}–{totals.calorieHigh} cal</p>
        )}
      </div>

      {draft.items.length === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {draft.items[0].servingDescription || '1 serving'}
            {draft.items[0].weightGrams != null && ` · Estimated weight: ${Math.round(draft.items[0].weightGrams)}g`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button type="button" variant="outline" size="icon" aria-label="Decrease quantity" disabled={isSaving || draft.items[0].quantity <= 0.5} onClick={() => updateItem(draft.items[0].id, scaleEstimateItem(draft.items[0], { quantity: Math.max(0.5, draft.items[0].quantity - 1) }))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-8 text-center text-lg font-semibold">{draft.items[0].quantity}</span>
            <Button type="button" variant="outline" size="icon" aria-label="Increase quantity" disabled={isSaving} onClick={() => updateItem(draft.items[0].id, scaleEstimateItem(draft.items[0], { quantity: draft.items[0].quantity + 1 }))}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {draft.assumptions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Assumptions</p>
          <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-0.5">
            {draft.assumptions.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}

      {draft.items[0]?.validation.warnings.map(warning => (
        <p key={warning} className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>
      ))}

      {editingId && draft.items[0] && (
        <div className="space-y-2 rounded-md border p-3">
          <Label htmlFor="edit-name">Name</Label>
          <Input id="edit-name" value={draft.items[0].name} onChange={(event) => updateItem(draft.items[0].id, { ...draft.items[0], name: event.target.value })} />
          <Label htmlFor="edit-cal">Calories</Label>
          <Input id="edit-cal" type="number" value={draft.items[0].nutrition.calories} onChange={(event) => {
            const calories = Number(event.target.value);
            updateItem(draft.items[0].id, {
              ...draft.items[0],
              nutrition: { ...draft.items[0].nutrition, calories },
              baseNutrition: { ...draft.items[0].baseNutrition, calories },
            });
          }} />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={onAdd} disabled={isSaving}>
          {isSaving ? 'Adding…' : 'Add to Today'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setEditingId(editingId ? null : draft.items[0]?.id)}>
          Edit details
        </Button>
      </div>
    </div>
  );
};

export const EstimateReviewDialog = ({
  draft,
  open,
  onOpenChange,
  onChange,
  onAdd,
  isSaving,
}: EstimateReviewProps & { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Review estimate</DialogTitle>
        <DialogDescription>Check the estimate before adding it to Today.</DialogDescription>
      </DialogHeader>
      <EstimateReview draft={draft} onChange={onChange} onAdd={onAdd} isSaving={isSaving} />
    </DialogContent>
  </Dialog>
);

export default EstimateReview;
