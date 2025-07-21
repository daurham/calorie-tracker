# Mod Development Guide

This guide explains how to create new mods for the calorie tracker application using the modular modal system.

## Overview

The mod system is now modular, with each mod having its own dedicated modal component. This makes it easier to create custom UIs for different types of mods without worrying about fitting into a generic template.

## Creating a New Mod

### 1. Create the Mod Handler

First, create your mod handler in `src/lib/mods/`:

```typescript
// src/lib/mods/myCustomMod.ts
import { ModHandler, ModInput, ModCalculation, ModMeal } from '@/types/mods';

export const myCustomMod: ModHandler = {
  id: 'my-custom-mod',
  name: 'My Custom Mod',
  description: 'Description of what this mod does',
  inputs: [
    {
      type: 'text',
      label: 'Input Label',
      key: 'inputKey',
      required: true,
      placeholder: 'Enter value'
    }
    // Add more inputs as needed
  ],

  calculate: (inputs: Record<string, any>): ModCalculation => {
    // Your calculation logic here
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  },

  generateMeal: (inputs: Record<string, any>): ModMeal => {
    const calculation = myCustomMod.calculate(inputs);
    
    return {
      id: `my-custom-mod-${Date.now()}`,
      name: 'Generated Meal Name',
      meal_type: 'mod',
      calories: calculation.calories,
      protein: calculation.protein,
      carbs: calculation.carbs,
      fat: calculation.fat,
      notes: 'Notes about the meal',
      instructions: 'Instructions for the meal',
      ingredients: [
        {
          id: 'ingredient-id',
          name: 'Ingredient Name',
          quantity: 1
        }
      ],
      modId: 'my-custom-mod',
      modData: {
        // Any additional data you want to store
      }
    };
  }
};
```

### 2. Register the Mod

Add your mod to `src/lib/mods/index.ts`:

```typescript
import { myCustomMod } from './myCustomMod';

// In the initializeMods function:
modManager.registerMod(myCustomMod);
```

### 3. Create the Modal Component

Create your modal component in `src/components/modals/`:

```typescript
// src/components/modals/MyCustomModal.tsx
import { useState, useEffect } from 'react';
import { YourIcon } from 'lucide-react'; // Choose appropriate icon
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { ModHandler, ModMeal } from '@/types/mods';
import BaseModModal from './BaseModModal';

interface MyCustomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mod: ModHandler;
  onMealGenerated: (meal: ModMeal) => void;
}

const MyCustomModal = ({ open, onOpenChange, mod, onMealGenerated }: MyCustomModalProps) => {
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
    return mod.inputs.every(input => {
      if (!input.required) return true;
      const value = inputs[input.key];
      return value !== undefined && value !== null && value !== '';
    });
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

  return (
    <BaseModModal
      open={open}
      onOpenChange={onOpenChange}
      mod={mod}
      onMealGenerated={onMealGenerated}
      icon={<YourIcon className="h-5 w-5" />}
    >
      <div className="space-y-4">
        {/* Add your custom input fields here */}
        <div className="space-y-2">
          <Label htmlFor="example">Example Input</Label>
          <Input
            id="example"
            type="text"
            value={inputs.example || ''}
            onChange={(e) => handleInputChange('example', e.target.value)}
            placeholder="Enter example value"
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
              <div>Calories: <span className="font-medium">{calculation.calories}</span></div>
              <div>Protein: <span className="font-medium">{calculation.protein}g</span></div>
              <div>Carbs: <span className="font-medium">{calculation.carbs}g</span></div>
              <div>Fat: <span className="font-medium">{calculation.fat}g</span></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleGenerateMeal}
          disabled={!isFormValid()}
          className="w-full"
        >
          Add to Today's Meals
        </Button>
      </div>
    </BaseModModal>
  );
};

export default MyCustomModal;
```

### 4. Add to Modal Factory

Add your modal to the factory in `src/components/modals/ModModalFactory.tsx`:

```typescript
import MyCustomModal from './MyCustomModal';

// In the switch statement:
case 'my-custom-mod':
  return (
    <MyCustomModal
      open={open}
      onOpenChange={onOpenChange}
      mod={mod}
      onMealGenerated={onMealGenerated}
    />
  );
```

## Using the Template

You can also use the provided template as a starting point:

1. Copy `src/components/modals/templates/ModModalTemplate.tsx`
2. Rename it to your mod name
3. Customize the inputs and logic
4. Add it to the factory

## Available Input Types

- `text`: Text input
- `number`: Number input
- `select`: Dropdown selection
- `radio`: Radio button group
- `grid-macros`: 2x2 grid for macro inputs (calories, protein, carbs, fat)

## Best Practices

1. **Use appropriate icons**: Choose icons that represent your mod's functionality
2. **Keep inputs simple**: Don't overwhelm users with too many fields
3. **Provide good defaults**: Set sensible default values where possible
4. **Validate inputs**: Ensure your calculation handles edge cases
5. **Test thoroughly**: Make sure your mod works with the portion system

## Example Mods

- **CostcoPizzaModal**: Shows how to handle radio buttons and number inputs
- **CustomFoodModal**: Shows how to handle a grid layout for macro inputs

## Troubleshooting

- **Modal not appearing**: Check that your mod is registered and the factory case is added
- **Calculation not working**: Ensure all required inputs are properly validated
- **Portion not applying**: The BaseModModal handles portions automatically 