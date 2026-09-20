import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui';
import { quickCaloriesToFoodLogInput } from '@/lib/quick-log';
import type { FoodLogInput } from '@/types/food-log';

interface QuickCaloriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: FoodLogInput) => Promise<unknown>;
}

const emptyForm = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};

const optionalMacro = (value: string) => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const QuickCaloriesDialog = ({ open, onOpenChange, onAdd }: QuickCaloriesDialogProps) => {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calories = Number(form.calories);
  const canSubmit = form.name.trim().length > 0 && Number.isFinite(calories) && calories > 0 && !isSaving;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      await onAdd(quickCaloriesToFoodLogInput({
        name: form.name,
        calories,
        protein: optionalMacro(form.protein),
        carbs: optionalMacro(form.carbs),
        fat: optionalMacro(form.fat),
      }));
      setForm(emptyForm);
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add calories');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      onOpenChange(next);
      if (!next) {
        setForm(emptyForm);
        setError(null);
      }
    }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick Calories</DialogTitle>
          <DialogDescription>
            Log calories without creating a saved food.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-cal-name">Food</Label>
            <Input
              id="quick-cal-name"
              value={form.name}
              onChange={(event) => setForm(prev => ({ ...prev, name: event.target.value }))}
              placeholder="Birthday cake"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-cal-calories">Calories</Label>
            <Input
              id="quick-cal-calories"
              type="number"
              min="1"
              step="1"
              value={form.calories}
              onChange={(event) => setForm(prev => ({ ...prev, calories: event.target.value }))}
              placeholder="450"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="quick-cal-protein">Protein</Label>
              <Input
                id="quick-cal-protein"
                type="number"
                min="0"
                step="0.1"
                value={form.protein}
                onChange={(event) => setForm(prev => ({ ...prev, protein: event.target.value }))}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-cal-carbs">Carbs</Label>
              <Input
                id="quick-cal-carbs"
                type="number"
                min="0"
                step="0.1"
                value={form.carbs}
                onChange={(event) => setForm(prev => ({ ...prev, carbs: event.target.value }))}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-cal-fat">Fat</Label>
              <Input
                id="quick-cal-fat"
                type="number"
                min="0"
                step="0.1"
                value={form.fat}
                onChange={(event) => setForm(prev => ({ ...prev, fat: event.target.value }))}
                placeholder="—"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={!canSubmit}>
            {isSaving ? 'Adding…' : 'Add'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCaloriesDialog;
