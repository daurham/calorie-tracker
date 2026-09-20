import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import ScannerModal from '@/components/modals/ScannerModal';
import { PackagedFoodApiError, extractNutritionLabelRequest, lookupBarcodeRequest, savePackagedFoodRequest } from '@/lib/packaged-foods/api-client';
import { emptyNutritionLabel, labelToPackagedFood } from '@/lib/packaged-foods/from-label';
import { resizeImageFile } from '@/lib/packaged-foods/image';
import { validateNutritionLabel } from '@/lib/food-ai/validate-label';
import type { FoodLogInput } from '@/types/food-log';
import type { NutritionLabelResult, NutritionLabelWarning } from '@/types/nutrition-label';
import type { PackagedFoodResult } from '@/types/packaged-food';
import NutritionLabelForm from './NutritionLabelForm';
import PackagedFoodReview from './PackagedFoodReview';

interface PackagedFoodFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: FoodLogInput) => Promise<unknown>;
}

type View =
  | { name: 'scanner' }
  | { name: 'lookup' }
  | { name: 'review'; product: PackagedFoodResult }
  | { name: 'fallback'; barcode: string; reason: 'not_found' | 'provider_error'; message: string }
  | { name: 'label'; barcode: string | null; label: NutritionLabelResult; warnings: NutritionLabelWarning[] };

const PackagedFoodFlow = ({ open, onOpenChange, onAdd }: PackagedFoodFlowProps) => {
  const [view, setView] = useState<View>({ name: 'scanner' });
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (open) {
      setView({ name: 'scanner' });
      setQuantity(1);
      setError(null);
      setIsSaving(false);
      setIsExtracting(false);
    }
  }, [open]);

  const close = () => onOpenChange(false);

  const openLabel = (barcode: string | null, label?: NutritionLabelResult, warnings: NutritionLabelWarning[] = []) => {
    const next = label || emptyNutritionLabel(barcode);
    setView({
      name: 'label',
      barcode,
      label: { ...next, barcode: next.barcode || barcode },
      warnings: warnings.length ? warnings : validateNutritionLabel(next),
    });
  };

  const handleBarcode = async (barcode: string) => {
    setView({ name: 'lookup' });
    setError(null);
    try {
      const result = await lookupBarcodeRequest(barcode);
      if (result.status === 'found' && result.product) {
        setQuantity(1);
        setView({ name: 'review', product: result.product });
        return;
      }
      setView({
        name: 'fallback',
        barcode,
        reason: result.status === 'provider_error' ? 'provider_error' : 'not_found',
        message: result.message || (result.status === 'provider_error' ? 'Open Food Facts is unavailable.' : 'Product not found'),
      });
    } catch (lookupError) {
      setView({
        name: 'fallback',
        barcode,
        reason: 'provider_error',
        message: lookupError instanceof Error ? lookupError.message : 'Open Food Facts is unavailable.',
      });
    }
  };

  const handleSaveProduct = async (product: PackagedFoodResult) => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await savePackagedFoodRequest(product, quantity);
      await onAdd(saved.foodLog);
      close();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not add packaged food');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtractFile = async (file: File, barcode: string | null, current: NutritionLabelResult) => {
    setIsExtracting(true);
    setError(null);
    try {
      const image = await resizeImageFile(file);
      const extracted = await extractNutritionLabelRequest(image, barcode);
      setView({
        name: 'label',
        barcode: extracted.barcode || barcode,
        label: extracted.label,
        warnings: extracted.warnings,
      });
    } catch (extractError) {
      const message = extractError instanceof PackagedFoodApiError
        ? extractError.message
        : 'Label extraction is unavailable. Enter the label manually.';
      setView({ name: 'label', barcode, label: current, warnings: validateNutritionLabel(current) });
      setError(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveLabel = async (barcode: string | null, label: NutritionLabelResult) => {
    const product = labelToPackagedFood(label, label.barcode || barcode);
    await handleSaveProduct(product);
  };

  if (!open) return null;

  if (view.name === 'scanner') {
    return <ScannerModal onDetected={(barcode) => void handleBarcode(barcode)} onClose={close} />;
  }

  return (
    <Dialog open onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="max-w-sm">
        {view.name === 'lookup' && (
          <>
            <DialogHeader>
              <DialogTitle>Looking up barcode</DialogTitle>
              <DialogDescription>Checking your foods, then Open Food Facts.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Looking up product…</p>
          </>
        )}

        {view.name === 'review' && (
          <>
            <DialogHeader>
              <DialogTitle>Packaged food</DialogTitle>
              <DialogDescription>Review the serving, then add it to Today.</DialogDescription>
            </DialogHeader>
            <PackagedFoodReview
              product={view.product}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAdd={() => void handleSaveProduct(view.product)}
              isSaving={isSaving}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </>
        )}

        {view.name === 'fallback' && (
          <>
            <DialogHeader>
              <DialogTitle>{view.reason === 'provider_error' ? 'Lookup unavailable' : 'Product not found'}</DialogTitle>
              <DialogDescription>{view.message}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {view.reason === 'provider_error' && (
                <Button type="button" variant="outline" className="w-full" onClick={() => void handleBarcode(view.barcode)}>
                  Retry
                </Button>
              )}
              <Button type="button" className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => openLabel(view.barcode)}>
                Scan nutrition label
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => openLabel(view.barcode)}>
                Enter manually
              </Button>
            </div>
          </>
        )}

        {view.name === 'label' && (
          <>
            <DialogHeader>
              <DialogTitle>Nutrition label</DialogTitle>
              <DialogDescription>
                Review the extracted fields before saving. The photo is not stored.
              </DialogDescription>
            </DialogHeader>
            <NutritionLabelForm
              label={view.label}
              warnings={view.warnings}
              barcode={view.barcode}
              error={error}
              isExtracting={isExtracting}
              isSaving={isSaving}
              onChange={(label) => setView({ ...view, label, warnings: validateNutritionLabel(label) })}
              onExtractFile={(file) => void handleExtractFile(file, view.barcode, view.label)}
              onSave={() => void handleSaveLabel(view.barcode, view.label)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PackagedFoodFlow;
