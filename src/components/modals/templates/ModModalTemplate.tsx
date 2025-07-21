import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react'; // Change this to appropriate icon
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { PortionSelector } from '@/components/ui';
import { ModHandler, ModMeal } from '@/types/mods';
import BaseModModal from '../BaseModModal';

interface ModModalTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
}

const ModModalTemplate = ({ open, onOpenChange, mod, onMealGenerated }: ModModalTemplateProps) => {
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
      icon={<Calculator className="h-5 w-5" />} // Change this to appropriate icon
    >
      {(handleGenerateMeal, portion, setPortion) => (
        <div className="space-y-4">
        {/* TODO: Add your custom input fields here */}
        {/* Example: */}
        {/* <div className="space-y-2">
          <Label htmlFor="example">Example Input</Label>
          <Input
            id="example"
            type="text"
            value={inputs.example || ''}
            onChange={(e) => handleInputChange('example', e.target.value)}
            placeholder="Enter example value"
            required
          />
        </div> */}

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
          onClick={() => handleGenerateMeal(inputs)}
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

export default ModModalTemplate; 