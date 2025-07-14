import { 
  getIngredients,
   getMealCombos, 
   addIngredient as apiAddIngredient, 
   updateIngredient as apiUpdateIngredient, 
   deleteIngredient as apiDeleteIngredient, 
   addMealCombo as apiAddMealCombo, 
   updateMealCombo as apiUpdateMealCombo,
  deleteMealCombo as apiDeleteMealCombo 
} from './api-client';

import { Ingredient, MealCombo } from '@/types';

// Ingredients
export async function getIngredientsData(): Promise<Ingredient[]> {
  // console.log('Getting ingredients from database');
  const ingredients = await getIngredients();
  // console.log("ingredients", ingredients);
  return ingredients;
}

export async function addIngredientData(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  return apiAddIngredient(ingredient);
}

export async function updateIngredientData(ingredient: Ingredient): Promise<Ingredient> {
  return apiUpdateIngredient(ingredient);
}

export async function deleteIngredientData(id: number): Promise<Ingredient> {
  return apiDeleteIngredient(id);
}

// Meal Combos
export async function getMealCombosData(): Promise<MealCombo[]> {
  // console.log('Getting meal combos from database');
  const combos = await getMealCombos();
  // console.log("combos", combos);
  return combos;
}

export async function addMealComboData(combo: Omit<MealCombo, 'id'>): Promise<MealCombo> {
  // console.log("adding meal combo", combo);
  const newCombo = await apiAddMealCombo(combo);
  // console.log("newCombo", newCombo);
  return newCombo;
}

export async function updateMealComboData(combo: MealCombo): Promise<MealCombo> {
  const updatedCombo = await apiUpdateMealCombo(combo);
  // console.log("updatedCombo", updatedCombo);
  return updatedCombo;
}

export async function deleteMealComboData(id: number): Promise<MealCombo> {
  const deletedCombo = await apiDeleteMealCombo(id);
  // console.log("deletedCombo", deletedCombo);
  return deletedCombo;
} 