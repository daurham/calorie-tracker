import { availableIngredients, sampleMealCombos } from '@/data/sampleData';
import { Ingredient, MealCombo, getIngredients, getMealCombos } from './db/schema';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function getIngredientsData(): Promise<Ingredient[]> {
  if (isDevelopment) {
    return availableIngredients;
  }
  return getIngredients();
}

export async function getMealCombosData(): Promise<MealCombo[]> {
  if (isDevelopment) {
    return sampleMealCombos;
  }
  return getMealCombos();
} 