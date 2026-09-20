import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '@/components/ui';
import { formatApproxCalories } from '@/lib/food-estimate/validate';
import { draftTotals, scaleEstimateItem } from '@/lib/food-estimate/scale-draft';
import type { EstimateDraft, EstimateItem } from '@/types/food-interpretation';

interface MultiFoodReviewProps {
  draft: EstimateDraft;
  onChange: (draft: EstimateDraft) => void;
  onAdd: () => void;
  onAddItem: (item: EstimateItem) => void;
  isSaving?: boolean;
}

const MultiFoodReview = ({ draft, onChange, onAdd, onAddItem, isSaving }: MultiFoodReviewProps) => {
  const totals = draftTotals(draft.items);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{draft.displayName}</h3>
      </div>
      <div className="space-y-3">
        {draft.items.map(item => (
          <div key={item.id} className="rounded-md border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.servingDescription || '1 serving'}</p>
              </div>
              <p className="font-semibold">{formatApproxCalories(item.nutrition.calories, item.usedAiFallback)} cal</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Qty</span>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="h-8 w-20"
                  value={item.quantity}
                  onChange={(event) => {
                    const quantity = Number(event.target.value);
                    if (!Number.isFinite(quantity) || quantity <= 0) return;
                    onChange({
                      ...draft,
                      items: draft.items.map(current => current.id === item.id ? scaleEstimateItem(item, { quantity }) : current),
                    });
                  }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 bg-emerald-500 px-3 hover:bg-emerald-600"
                onClick={() => onAddItem(item)}
                disabled={isSaving}
                aria-label={`Add ${item.name}`}
              >
                Add
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-3">
        <p className="font-medium">Total {formatApproxCalories(totals.calories, totals.estimated)} cal</p>
      </div>
      <Button type="button" className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={onAdd} disabled={isSaving}>
        {isSaving ? 'Adding…' : 'Add All'}
      </Button>
    </div>
  );
};

export const MultiFoodReviewDialog = ({
  draft,
  open,
  onOpenChange,
  onChange,
  onAdd,
  onAddItem,
  isSaving,
}: MultiFoodReviewProps & { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Review foods</DialogTitle>
        <DialogDescription>Add one item, or add the whole group to Today.</DialogDescription>
      </DialogHeader>
      <MultiFoodReview draft={draft} onChange={onChange} onAdd={onAdd} onAddItem={onAddItem} isSaving={isSaving} />
    </DialogContent>
  </Dialog>
);

export default MultiFoodReview;
