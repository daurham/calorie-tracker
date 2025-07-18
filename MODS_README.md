# Modular Mod System

This application now includes a modular mod system that allows you to add custom meal calculation features without disrupting the core application.

## Features

### Current Mods

#### Costco Pizza Slice Mod
- **Description**: Calculate macros for Costco pizza slices with variable weight
- **Features**:
  - Choose between Cheese or Pepperoni pizza
  - Input the actual weight of your slice (defaults to 200g)
  - Automatically calculates calories, protein, carbs, and fat
  - Accounts for Costco's randomly sized slices

### How to Use Mods

1. **Access Mods**: Click the "Mods" button in the navigation bar
2. **Enable/Disable**: Use the mod settings to enable or disable mods
3. **Use a Mod**: 
   - Go to "Available Meals" section
   - Look for mod cards (purple border with sparkle icon)
   - Click "Configure" to open the mod interface
   - Fill in the required information
   - Click "Calculate Macros" to see the results
   - Click "Add to Today's Meals" to add the calculated meal

### Mod Settings

- **Location**: Click the "Mods" button in the navigation bar
- **Features**:
  - Enable/disable individual mods
  - View mod descriptions and versions
  - Manage mod configurations

## Technical Details

### Mod System Architecture

The mod system is built with the following components:

1. **ModManager** (`src/lib/mods/modManager.ts`): Singleton class that manages mod registration and configuration
2. **Mod Types** (`src/types/mods.ts`): TypeScript interfaces for mod structure
3. **Mod Components**: UI components for mod interaction
4. **Mod Handlers**: Individual mod implementations

### Creating New Mods

To create a new mod:

1. **Create Mod Handler** (`src/lib/mods/yourMod.ts`):
```typescript
import { ModHandler, ModInput, ModCalculation, ModMeal } from '@/types/mods';

export const yourMod: ModHandler = {
  id: 'your-mod-id',
  name: 'Your Mod Name',
  description: 'Description of what your mod does',
  inputs: [
    {
      type: 'number',
      label: 'Weight (grams)',
      key: 'weight',
      required: true,
      defaultValue: 100,
      min: 1,
      max: 1000
    }
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
    // Your meal generation logic here
    return {
      id: `your-mod-${Date.now()}`,
      name: 'Your Mod Meal',
      meal_type: 'mod',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ingredients: [],
      modId: 'your-mod-id'
    };
  }
};
```

2. **Register the Mod** (`src/lib/mods/index.ts`):
```typescript
import { yourMod } from './yourMod';

export function initializeMods(): void {
  modManager.registerMod(costcoPizzaMod);
  modManager.registerMod(yourMod); // Add your mod here
}
```

### Mod Input Types

- **text**: Text input field
- **number**: Numeric input with optional min/max/step
- **select**: Dropdown selection
- **radio**: Radio button group

### Mod Configuration

Mods are automatically enabled by default and their configurations are stored in localStorage. Users can enable/disable mods through the mod settings interface.

## Future Enhancements

- More mod types (restaurant-specific, food chains, etc.)
- Mod marketplace/community sharing
- Advanced mod configuration options
- Mod analytics and usage tracking 