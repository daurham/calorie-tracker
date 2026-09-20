import { useRef, useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import type { NutritionLabelResult, NutritionLabelWarning } from '@/types/nutrition-label';

interface NutritionLabelFormProps {
  label: NutritionLabelResult;
  warnings: NutritionLabelWarning[];
  barcode?: string | null;
  error?: string | null;
  isExtracting?: boolean;
  isSaving?: boolean;
  onChange: (label: NutritionLabelResult) => void;
  onExtractFile: (file: File) => void;
  onSave: () => void;
}

const toField = (value: number | null | undefined) => (value == null ? '' : String(value));

const NutritionLabelForm = ({
  label,
  warnings,
  barcode,
  error,
  isExtracting = false,
  isSaving = false,
  onChange,
  onExtractFile,
  onSave,
}: NutritionLabelFormProps) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const update = (patch: Partial<NutritionLabelResult>) => onChange({ ...label, ...patch });
  const updateServing = (patch: Partial<NutritionLabelResult['serving']>) =>
    onChange({ ...label, serving: { ...label.serving, ...patch } });

  const calories = Number(label.calories);
  const canSave = Boolean(label.productName?.trim()) && Number.isFinite(calories) && calories > 0 && !isSaving && !isExtracting;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) {
          setLocalError('Enter a product name and calories before saving.');
          return;
        }
        onSave();
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onExtractFile(file);
          event.target.value = '';
        }}
      />

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => fileRef.current?.click()} disabled={isExtracting}>
          {isExtracting ? 'Reading label…' : 'Scan nutrition label'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The photo is used only to read the label, then discarded. You can edit every field.
      </p>

      <div className="space-y-2">
        <Label htmlFor="label-name">Product name</Label>
        <Input
          id="label-name"
          value={label.productName || ''}
          onChange={(event) => update({ productName: event.target.value })}
          placeholder="Protein Bar"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="label-serving-amount">Serving size</Label>
          <Input
            id="label-serving-amount"
            type="number"
            min="0"
            step="0.1"
            value={toField(label.serving.amount)}
            onChange={(event) => updateServing({ amount: event.target.value === '' ? null : Number(event.target.value) })}
            placeholder="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label-serving-unit">Serving unit</Label>
          <Input
            id="label-serving-unit"
            value={label.serving.unit || ''}
            onChange={(event) => updateServing({
              unit: event.target.value || null,
              description: event.target.value || label.serving.description,
            })}
            placeholder="bar"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label-calories">Calories</Label>
        <Input
          id="label-calories"
          type="number"
          min="1"
          step="1"
          value={toField(label.calories)}
          onChange={(event) => update({ calories: event.target.value === '' ? null : Number(event.target.value) })}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
          <Label htmlFor="label-protein">Protein</Label>
          <Input
            id="label-protein"
            type="number"
            min="0"
            step="0.1"
            value={toField(label.protein)}
            onChange={(event) => update({ protein: event.target.value === '' ? null : Number(event.target.value) })}
            placeholder="—"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label-carbs">Carbs</Label>
          <Input
            id="label-carbs"
            type="number"
            min="0"
            step="0.1"
            value={toField(label.carbs)}
            onChange={(event) => update({ carbs: event.target.value === '' ? null : Number(event.target.value) })}
            placeholder="—"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label-fat">Fat</Label>
          <Input
            id="label-fat"
            type="number"
            min="0"
            step="0.1"
            value={toField(label.fat)}
            onChange={(event) => update({ fat: event.target.value === '' ? null : Number(event.target.value) })}
            placeholder="—"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="label-servings">Servings / container</Label>
          <Input
            id="label-servings"
            type="number"
            min="0"
            step="0.5"
            value={toField(label.servingsPerContainer)}
            onChange={(event) => update({
              servingsPerContainer: event.target.value === '' ? null : Number(event.target.value),
            })}
            placeholder="optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label-barcode">Barcode</Label>
          <Input
            id="label-barcode"
            value={label.barcode || barcode || ''}
            onChange={(event) => update({ barcode: event.target.value || null })}
            placeholder="optional"
          />
        </div>
      </div>

      {warnings.map(warning => (
        <p key={warning.code} className="text-sm text-amber-600 dark:text-amber-400">{warning.message}</p>
      ))}
      {(error || localError) && <p className="text-sm text-red-500">{error || localError}</p>}

      <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={!canSave}>
        {isSaving ? 'Saving…' : 'Save & Add'}
      </Button>
    </form>
  );
};

export default NutritionLabelForm;
