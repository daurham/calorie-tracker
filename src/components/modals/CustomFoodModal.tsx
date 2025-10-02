import { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { PortionSelector } from '@/components/ui';
import { ModHandler, ModMeal } from '@/types/mods';
import BaseModModal from './BaseModModal';

interface CustomFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
}

const CustomFoodModal = ({ open, onOpenChange, mod, onMealGenerated }: CustomFoodModalProps) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [calculation, setCalculation] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [portionValid, setPortionValid] = useState(true);

  // Clear form when modal opens
  useEffect(() => {
    if (open) {
      setInputs({});
      setCalculation(null);
      setPortionValid(true);
    }
  }, [open]);

  const handleInputChange = (key: string, value: any) => {
    const newInputs = {
      ...inputs,
      [key]: value
    };
    setInputs(newInputs);
    
    // Auto-calculate if all required inputs are filled
    const hasAllRequiredInputs = mod.inputs.every(input => {
      if (!input.required) return true;
      
      // Special handling for grid-macros type - now optional, so always true
      if (input.type === 'grid-macros') {
        return true;
      }
      
      const inputValue = newInputs[input.key];
      return inputValue !== undefined && inputValue !== null && inputValue !== '';
    });
    
    if (hasAllRequiredInputs) {
      try {
        const result = mod.calculate(newInputs);
        setCalculation(result);
      } catch (error) {
        console.error('Error calculating mod:', error);
        setCalculation(null);
      }
    } else {
      setCalculation(null);
    }
  };

  const isFormValid = () => {
    const inputsValid = mod.inputs.every(input => {
      if (!input.required) return true;
      
      // Special handling for grid-macros type - now optional, so always true
      if (input.type === 'grid-macros') {
        return true;
      }
      
      const value = inputs[input.key];
      return value !== undefined && value !== null && value !== '';
    });
    
    return inputsValid && portionValid;
  };



  return (
    <BaseModModal
      open={open}
      onOpenChange={onOpenChange}
      mod={mod}
      onMealGenerated={onMealGenerated}
      icon={<Utensils className="h-5 w-5" />}
    >
      {(handleGenerateMeal, portion, setPortion) => (
        <div className="space-y-4">
        {/* Food Name */}
        <div className="space-y-2">
          <Label htmlFor="foodName">Food Name</Label>
          <Input
            id="foodName"
            type="text"
            value={inputs.foodName || ''}
            onChange={(e) => handleInputChange('foodName', e.target.value)}
            placeholder="e.g., Restaurant Burger, Birthday Cake Slice"
            required
          />
        </div>

        {/* Macro Inputs Grid */}
        <div className="space-y-2">
          <Label>Nutritional Information</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={inputs.calories || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('calories', value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0"
                min={0}
                max={5000}
                step={1}
              />
            </div>
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={inputs.protein || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('protein', value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0"
                min={0}
                max={200}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={inputs.carbs || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('carbs', value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0"
                min={0}
                max={500}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={inputs.fat || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('fat', value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0"
                min={0}
                max={200}
                step={0.1}
              />
            </div>
          </div>
        </div>

        {/* Serving Size */}
        {/* <div className="space-y-2">
          <Label htmlFor="servingSize">Serving Size (g)</Label>
          <Input
            id="servingSize"
            type="number"
            value={inputs.servingSize || ''}
            onChange={(e) => handleInputChange('servingSize', parseFloat(e.target.value) || 0)}
            placeholder="Optional: weight in grams"
            min={0}
            max={2000}
            step={1}
          />
        </div> */}

        {/* Notes */}
        {/* <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            id="notes"
            type="text"
            value={inputs.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="e.g., Restaurant name, special occasion, etc."
          />
        </div> */}

        {/* Auto-calculation info */}
        {/* <div className="text-xs text-muted-foreground text-center">
          Macros will be calculated automatically as you fill in the required fields
        </div> */}

        {/* Calculation Results */}
        {/* {calculation && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">Calculated Macros:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Calories: <span className="font-medium">{Math.round(calculation.calories * portion)}</span></div>
              <div>Protein: <span className="font-medium">{Math.round(calculation.protein * portion * 10) / 10}g</span></div>
              <div>Carbs: <span className="font-medium">{Math.round(calculation.carbs * portion * 10) / 10}g</span></div>
              <div>Fat: <span className="font-medium">{Math.round(calculation.fat * portion * 10) / 10}g</span></div>
            </div>
          </div>
        )} */}

        {/* Portion Selection */}
        <PortionSelector 
          portion={portion} 
          setPortion={setPortion}
          onValidationChange={setPortionValid}
        />

        {/* Submit Button */}
        <Button
          onClick={() => {
            handleGenerateMeal(inputs);
            // Clear form after successful submission
            setInputs({});
            setCalculation(null);
          }}
          disabled={!isFormValid()}
          className="w-full"
        >
          Add to Today's Meals
        </Button>
      </div>
      )}
    </BaseModModal>
  );
};

export default CustomFoodModal; 