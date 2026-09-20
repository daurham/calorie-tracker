import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatMacroLine, formatProductSubtitle } from '@/lib/packaged-foods/display';
import { scalePackagedNutrition } from '@/lib/packaged-foods/normalize';
import type { PackagedFoodResult } from '@/types/packaged-food';

interface PackagedFoodReviewProps {
  product: PackagedFoodResult;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAdd: () => void;
  isSaving?: boolean;
}

const PackagedFoodReview = ({
  product,
  quantity,
  onQuantityChange,
  onAdd,
  isSaving = false,
}: PackagedFoodReviewProps) => {
  const nutrition = scalePackagedNutrition(
    product.selectedNutrition || product.nutritionPerServing,
    quantity
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{formatProductSubtitle(product)}</p>
      </div>
      <p className="text-base font-medium">{formatMacroLine(nutrition)}</p>
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onQuantityChange(Math.max(0.5, Number((quantity - 1).toFixed(1))))}
          disabled={quantity <= 0.5 || isSaving}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-8 text-center text-lg font-semibold">{quantity}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onQuantityChange(Number((quantity + 1).toFixed(1)))}
          disabled={isSaving}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        type="button"
        className="w-full bg-emerald-500 hover:bg-emerald-600"
        onClick={onAdd}
        disabled={!nutrition || isSaving}
      >
        {isSaving ? 'Adding…' : 'Add to Today'}
      </Button>
    </div>
  );
};

export default PackagedFoodReview;
