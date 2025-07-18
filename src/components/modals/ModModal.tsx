import { useState, useEffect } from 'react';
import { X, Calculator, Pizza } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { ModHandler, ModInput, ModMeal } from '@/types/mods';

interface ModModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
}

const ModModal = ({ open, onOpenChange, mod, onMealGenerated }: ModModalProps) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [calculation, setCalculation] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

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
      setCalculation(null);
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

  const handleGenerateMeal = () => {
    try {
      const meal = mod.generateMeal(inputs);
      onMealGenerated(meal);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating meal:', error);
    }
  };

  const renderInput = (input: ModInput) => {
    const value = inputs[input.key] || '';

    switch (input.type) {
      case 'text':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key}>{input.label}</Label>
            <Input
              id={input.key}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(input.key, e.target.value)}
              placeholder={input.placeholder}
              required={input.required}
            />
          </div>
        );

      case 'number':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key}>{input.label}</Label>
            <Input
              id={input.key}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(input.key, parseFloat(e.target.value) || 0)}
              placeholder={input.placeholder}
              min={input.min}
              max={input.max}
              step={input.step}
              required={input.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key}>{input.label}</Label>
            <select
              id={input.key}
              value={value}
              onChange={(e) => handleInputChange(input.key, e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required={input.required}
            >
              <option value="">Select an option</option>
              {input.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={input.key} className="space-y-2">
            <Label>{input.label}</Label>
            <div className="space-y-2">
              {input.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${input.key}-${option.value}`}
                    name={input.key}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleInputChange(input.key, e.target.value)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <Label htmlFor={`${input.key}-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isFormValid = () => {
    return mod.inputs.every(input => {
      if (!input.required) return true;
      const value = inputs[input.key];
      return value !== undefined && value !== null && value !== '';
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pizza className="h-5 w-5" />
            {mod.name}
          </DialogTitle>
          <DialogDescription>
            {mod.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input Fields */}
          <div className="space-y-4">
            {mod.inputs.map(renderInput)}
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
                <div>Calories: <span className="font-medium">{calculation.calories}</span></div>
                <div>Protein: <span className="font-medium">{calculation.protein}g</span></div>
                <div>Carbs: <span className="font-medium">{calculation.carbs}g</span></div>
                <div>Fat: <span className="font-medium">{calculation.fat}g</span></div>
              </div>
            </div>
          )}

          {/* Generate Meal Button */}
          {calculation && (
            <Button
              onClick={handleGenerateMeal}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Add to Today's Meals
            </Button>
          )}
          
          {/* No calculation yet */}
          {!calculation && (
            <Button
              disabled
              className="w-full bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
            >
              Fill in required fields to calculate
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModModal; 