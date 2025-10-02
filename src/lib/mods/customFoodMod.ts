import { ModHandler, ModInput, ModCalculation, ModMeal } from '@/types/mods';
import { capitalizeMealName } from '@/lib/utils';

export const customFoodMod: ModHandler = {
  id: 'custom-food',
  name: 'Custom Food Item',
  description: 'Add any food item with custom macros. Perfect for one-time or rarely eaten foods that you don\'t want cluttering your regular meal list.',
  inputs: [
    {
      type: 'text',
      label: 'Food Name',
      key: 'foodName',
      required: true,
      placeholder: 'e.g., Restaurant Burger, Birthday Cake Slice'
    },
    {
      type: 'grid-macros',
      label: 'Nutritional Information',
      key: 'macros',
      required: false,
      fields: [
        { key: 'calories', label: 'Calories', placeholder: '0', min: 0, max: 5000, step: 1 },
        { key: 'protein', label: 'Protein (g)', placeholder: '0', min: 0, max: 200, step: 0.1 },
        { key: 'carbs', label: 'Carbs (g)', placeholder: '0', min: 0, max: 500, step: 0.1 },
        { key: 'fat', label: 'Fat (g)', placeholder: '0', min: 0, max: 200, step: 0.1 }
      ]
    },
    {
      type: 'number',
      label: 'Serving Size (g)',
      key: 'servingSize',
      required: false,
      placeholder: 'Optional: weight in grams',
      min: 0,
      max: 2000,
      step: 1
    },
  ],

  calculate: (inputs: Record<string, any>): ModCalculation => {
    const { calories, protein, carbs, fat } = inputs;
    
    return {
      calories: Math.round(calories || 0),
      protein: Math.round((protein || 0) * 10) / 10, // Round to 1 decimal
      carbs: Math.round((carbs || 0) * 10) / 10,
      fat: Math.round((fat || 0) * 10) / 10
    };
  },

  generateMeal: (inputs: Record<string, any>): ModMeal => {
    const { foodName, calories, protein, carbs, fat, servingSize, notes } = inputs;
    const calculation = customFoodMod.calculate(inputs);
    
    const servingInfo = servingSize ? ` (${servingSize}g)` : '';
    const notesInfo = notes ? ` - ${notes}` : '';
    
    return {
      id: `custom-food-${Date.now()}`,
      name: capitalizeMealName(foodName),
      meal_type: 'mod',
      calories: calculation.calories,
      protein: calculation.protein,
      carbs: calculation.carbs,
      fat: calculation.fat,
      notes: `Custom food item${servingInfo}${notesInfo}`,
      instructions: 'This is a custom food item with manually entered macros. Adjust portion size as needed.',
      ingredients: [
        {
          id: `custom-food-${foodName.toLowerCase().replace(/\s+/g, '-')}`,
          name: foodName,
          quantity: servingSize || 1
        }
      ],
      modId: 'custom-food',
      weight: servingSize,
      modData: {
        foodName,
        servingSize,
        notes,
        originalCalculation: calculation
      }
    };
  }
}; 