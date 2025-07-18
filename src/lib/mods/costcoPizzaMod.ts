import { ModHandler, ModInput, ModCalculation, ModMeal } from '@/types/mods';

// Costco Pizza nutritional data per 100g
const COSTCO_PIZZA_DATA = {
  cheese: {
    calories: 266,
    protein: 12.5,
    carbs: 28.0,
    fat: 12.0
  },
  pepperoni: {
    calories: 290,
    protein: 13.5,
    carbs: 28.0,
    fat: 15.0
  }
};

// Default slice weight (grams) - Costco slices are notoriously large
const DEFAULT_SLICE_WEIGHT = 200; // grams

export const costcoPizzaMod: ModHandler = {
  id: 'costco-pizza-slice',
  name: 'Costco Pizza Slice',
  description: 'Calculate macros for Costco pizza slices. Costco pizza slices are cut randomly, so you can input the actual weight of your slice.',
  inputs: [
    {
      type: 'radio',
      label: 'Pizza Type',
      key: 'pizzaType',
      required: true,
      options: [
        { value: 'cheese', label: 'Cheese Pizza' },
        { value: 'pepperoni', label: 'Pepperoni Pizza' }
      ],
      defaultValue: 'cheese'
    },
    {
      type: 'number',
      label: 'Slice Weight (grams)',
      key: 'weight',
      required: true,
      defaultValue: DEFAULT_SLICE_WEIGHT,
      placeholder: 'Enter the weight of your slice',
      min: 50,
      max: 500,
      step: 1
    }
  ],

  calculate: (inputs: Record<string, any>): ModCalculation => {
    const { pizzaType, weight } = inputs;
    const pizzaData = COSTCO_PIZZA_DATA[pizzaType as keyof typeof COSTCO_PIZZA_DATA];
    
    if (!pizzaData || !weight) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const multiplier = weight / 100; // Convert to per 100g basis
    
    return {
      calories: Math.round(pizzaData.calories * multiplier),
      protein: Math.round(pizzaData.protein * multiplier * 10) / 10, // Round to 1 decimal
      carbs: Math.round(pizzaData.carbs * multiplier * 10) / 10,
      fat: Math.round(pizzaData.fat * multiplier * 10) / 10
    };
  },

  generateMeal: (inputs: Record<string, any>): ModMeal => {
    const { pizzaType, weight } = inputs;
    const calculation = costcoPizzaMod.calculate(inputs);
    const pizzaTypeLabel = pizzaType === 'cheese' ? 'Cheese' : 'Pepperoni';
    
    return {
      id: `costco-pizza-${Date.now()}`,
      name: `Costco ${pizzaTypeLabel} Pizza Slice`,
      meal_type: 'mod',
      calories: calculation.calories,
      protein: calculation.protein,
      carbs: calculation.carbs,
      fat: calculation.fat,
      notes: `${weight}g slice of Costco ${pizzaTypeLabel.toLowerCase()} pizza`,
      instructions: 'Costco pizza slices are cut randomly, so the weight can vary significantly. This calculation is based on the actual weight of your slice.',
      ingredients: [
        {
          id: `costco-pizza-${pizzaType}`,
          name: `Costco ${pizzaTypeLabel} Pizza`,
          quantity: weight
        }
      ],
      modId: 'costco-pizza-slice',
      weight: weight, // Include weight for display
      modData: {
        pizzaType,
        weight,
        originalCalculation: calculation
      }
    };
  }
}; 