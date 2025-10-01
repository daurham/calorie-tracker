import { ModHandler, ModInput, ModCalculation, ModMeal } from '@/types/mods';
import { capitalizeMealName } from '@/lib/utils';

export const aiFoodRecognitionMod: ModHandler = {
  id: 'ai-food-recognition',
  name: 'AI Food Analyzer',
  description: 'Describe what you ate and let AI estimate the nutritional information for you.',
  inputs: [
    {
      type: 'text',
      label: 'Food Description',
      key: 'description',
      required: true,
      placeholder: 'e.g., Grilled chicken breast with rice and vegetables',
      defaultValue: ''
    }
  ],

  calculate: (inputs: Record<string, any>): ModCalculation => {
    const { calories = 0, protein = 0, carbs = 0, fat = 0, portion = 1 } = inputs;
    
    return {
      calories: Math.round(calories * portion),
      protein: Math.round(protein * portion * 10) / 10,
      carbs: Math.round(carbs * portion * 10) / 10,
      fat: Math.round(fat * portion * 10) / 10
    };
  },

  generateMeal: (inputs: Record<string, any>): ModMeal => {
    const { 
      description, 
      name = 'AI Recognized Food', 
      calories = 0, 
      protein = 0, 
      carbs = 0, 
      fat = 0,
      portion = 1 
    } = inputs;
    
    const calculation = aiFoodRecognitionMod.calculate(inputs);
    
    return {
      id: `ai-food-${Date.now()}`,
      name: capitalizeMealName(name),
      meal_type: 'mod',
      calories: calculation.calories,
      protein: calculation.protein,
      carbs: calculation.carbs,
      fat: calculation.fat,
      notes: `AI recognized: ${description}`,
      instructions: 'This meal was created using AI food recognition.',
      ingredients: [],
      modId: 'ai-food-recognition',
      modData: {
        description,
        name,
        calories,
        protein,
        carbs,
        fat,
        portion,
        originalCalculation: calculation
      }
    };
  }
};
