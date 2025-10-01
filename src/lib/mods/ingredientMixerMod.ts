import { ModHandler, ModInput, ModCalculation, ModMeal } from '@/types/mods';
import { capitalizeMealName } from '@/lib/utils';

export const ingredientMixerMod: ModHandler = {
  id: 'ingredient-mixer',
  name: 'Ingredient Mixer',
  description: 'Mix ingredients together to create a custom meal. Perfect for adding extras to existing meals or creating quick combinations.',
  inputs: [
    {
      type: 'text',
      label: 'Meal Name',
      key: 'mealName',
      required: true,
      placeholder: 'e.g., Omelette with Extra Egg',
      defaultValue: ''
    },
    {
      type: 'number',
      label: 'Portion Size',
      key: 'portion',
      required: true,
      defaultValue: 1,
      placeholder: 'Enter portion size',
      min: 0.1,
      max: 10,
      step: 0.1
    }
  ],

  calculate: (inputs: Record<string, any>): ModCalculation => {
    const selectedIngredients = inputs.selectedIngredients || [];
    if (selectedIngredients.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const totals = selectedIngredients.reduce((acc, ingredient) => {
      const quantity = ingredient.quantity || 1;
      return {
        calories: acc.calories + (ingredient.calories * quantity),
        protein: acc.protein + (ingredient.protein * quantity),
        carbs: acc.carbs + (ingredient.carbs * quantity),
        fat: acc.fat + (ingredient.fat * quantity),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const portion = inputs.portion || 1;
    
    return {
      calories: Math.round(totals.calories * portion),
      protein: Math.round(totals.protein * portion * 10) / 10,
      carbs: Math.round(totals.carbs * portion * 10) / 10,
      fat: Math.round(totals.fat * portion * 10) / 10
    };
  },

  generateMeal: (inputs: Record<string, any>): ModMeal => {
    const { mealName, portion, selectedIngredients = [] } = inputs;
    const calculation = ingredientMixerMod.calculate(inputs);
    
    return {
      id: `custom-meal-${Date.now()}`,
      name: capitalizeMealName(mealName),
      meal_type: 'mod',
      calories: calculation.calories,
      protein: calculation.protein,
      carbs: calculation.carbs,
      fat: calculation.fat,
      notes: `Custom meal with ${selectedIngredients.length} ingredient${selectedIngredients.length !== 1 ? 's' : ''}`,
      instructions: 'This is a custom meal created by combining selected ingredients.',
      ingredients: selectedIngredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity || 1
      })),
      modId: 'ingredient-mixer',
      modData: {
        mealName,
        portion,
        selectedIngredients,
        originalCalculation: calculation
      }
    };
  }
};
