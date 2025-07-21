import { useState, useEffect } from 'react';
import { Pizza } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { PortionSelector } from '@/components/ui';
import { ModHandler, ModMeal } from '@/types/mods';
import BaseModModal from './BaseModModal';

interface CostcoPizzaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
}

const CostcoPizzaModal = ({ open, onOpenChange, mod, onMealGenerated }: CostcoPizzaModalProps) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [calculation, setCalculation] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [portionValid, setPortionValid] = useState(true);

  // Initialize inputs with default values
  useEffect(() => {
    if (open && mod) {
      const defaultInputs: Record<string, any> = {};
      mod.inputs.forEach(input => {
        if (input.defaultValue !== undefined) {
          defaultInputs[input.key] = input.defaultValue;
        }
      });
      setInputs(defaultInputs);
      
      // Trigger initial calculation if all required inputs have defaults
      const hasAllRequiredInputs = mod.inputs.every(input => {
        if (!input.required) return true;
        const inputValue = defaultInputs[input.key];
        return inputValue !== undefined && inputValue !== null && inputValue !== '';
      });
      
      if (hasAllRequiredInputs) {
        try {
          const result = mod.calculate(defaultInputs);
          setCalculation(result);
        } catch (error) {
          console.error('Error calculating mod:', error);
          setCalculation(null);
        }
      } else {
        setCalculation(null);
      }
    }
  }, [open, mod]);

  const handleInputChange = (key: string, value: any) => {
    const newInputs = {
      ...inputs,
      [key]: value
    };
    setInputs(newInputs);
    
    // Auto-calculate if all required inputs are filled
    const hasAllRequiredInputs = mod.inputs.every(input => {
      if (!input.required) return true;
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
      icon={<Pizza className="h-5 w-5" />}
    >
      {(handleGenerateMeal, portion, setPortion) => (
        <div className="space-y-4">
        {/* Pizza Type Selection */}
        <div className="space-y-2">
          <Label>Pizza Type</Label>
          <div className="space-y-2">
            {[
              { value: 'cheese', label: 'Cheese Pizza' },
              { value: 'pepperoni', label: 'Pepperoni Pizza' }
            ].map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`pizzaType-${option.value}`}
                  name="pizzaType"
                  value={option.value}
                  checked={inputs.pizzaType === option.value}
                  onChange={(e) => handleInputChange('pizzaType', e.target.value)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <Label htmlFor={`pizzaType-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Slice Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight">Slice Weight (grams)</Label>
          <Input
            id="weight"
            type="number"
            value={inputs.weight || ''}
            onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
            placeholder="Enter the weight of your slice"
            min={50}
            max={500}
            step={1}
            required
          />
        </div>

        {/* Auto-calculation info */}
        <div className="text-xs text-muted-foreground text-center">
          Macros will be calculated automatically as you fill in the required fields
        </div>

        {/* Calculation Results */}
        {calculation && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">Calculated Macros:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Calories: <span className="font-medium">{Math.round(calculation.calories * portion)}</span></div>
              <div>Protein: <span className="font-medium">{Math.round(calculation.protein * portion * 10) / 10}g</span></div>
              <div>Carbs: <span className="font-medium">{Math.round(calculation.carbs * portion * 10) / 10}g</span></div>
              <div>Fat: <span className="font-medium">{Math.round(calculation.fat * portion * 10) / 10}g</span></div>
            </div>
          </div>
        )}

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
            // Reset to default values after successful submission
            const defaultInputs: Record<string, any> = {};
            mod.inputs.forEach(input => {
              if (input.defaultValue !== undefined) {
                defaultInputs[input.key] = input.defaultValue;
              }
            });
            setInputs(defaultInputs);
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

export default CostcoPizzaModal; 