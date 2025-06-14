import { availableIngredients, sampleMealCombos } from '@/data/sampleData';
import { Ingredient, MealCombo, getIngredients, getMealCombos } from './db/schema';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function getIngredientsData(): Promise<Ingredient[]> {
  if (isDevelopment) {
    return availableIngredients;
  }
  console.log('Getting ingredients from database');
  return getIngredients();
}

export async function getMealCombosData(): Promise<MealCombo[]> {
  if (isDevelopment) {
    return sampleMealCombos;
  }
  console.log('Getting meal combos from database');
  return getMealCombos();
} 