import { availableIngredients, sampleMealCombos } from '@/data/sampleData';
import { Ingredient, MealCombo, getIngredients, getMealCombos, addIngredient as apiAddIngredient, updateIngredient as apiUpdateIngredient, deleteIngredient as apiDeleteIngredient, addMealCombo as apiAddMealCombo, updateMealCombo as apiUpdateMealCombo, deleteMealCombo as apiDeleteMealCombo } from './api-client';

const isDevelopment = import.meta.env.NODE_ENV === 'development';

// Helper to generate a new ID for development mode
const generateId = () => Math.floor(Math.random() * 1000000);

// Ingredients
export async function getIngredientsData(): Promise<Ingredient[]> {
  if (isDevelopment) {
    return availableIngredients;
  }
  console.log('Getting ingredients from database');
  return getIngredients();
}

export async function addIngredientData(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  if (isDevelopment) {
    const newIngredient = { ...ingredient, id: generateId() };
    availableIngredients.push(newIngredient);
    return newIngredient;
  }
  return apiAddIngredient(ingredient);
}

export async function updateIngredientData(ingredient: Ingredient): Promise<Ingredient> {
  if (isDevelopment) {
    const index = availableIngredients.findIndex(i => i.id === ingredient.id);
    if (index === -1) throw new Error('Ingredient not found');
    availableIngredients[index] = ingredient;
    return ingredient;
  }
  return apiUpdateIngredient(ingredient);
}

export async function deleteIngredientData(id: number): Promise<Ingredient> {
  if (isDevelopment) {
    const index = availableIngredients.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Ingredient not found');
    const deleted = availableIngredients[index];
    availableIngredients.splice(index, 1);
    return deleted;
  }
  return apiDeleteIngredient(id);
}

// Meal Combos
export async function getMealCombosData(): Promise<MealCombo[]> {
  if (isDevelopment) {
    return sampleMealCombos;
  }
  console.log('Getting meal combos from database');
  return getMealCombos();
}

export async function addMealComboData(combo: Omit<MealCombo, 'id'>): Promise<MealCombo> {
  if (isDevelopment) {
    const newCombo = { ...combo, id: generateId() };
    sampleMealCombos.push(newCombo);
    return newCombo;
  }
  return apiAddMealCombo(combo);
}

export async function updateMealComboData(combo: MealCombo): Promise<MealCombo> {
  if (isDevelopment) {
    const index = sampleMealCombos.findIndex(c => c.id === combo.id);
    if (index === -1) throw new Error('Meal combo not found');
    sampleMealCombos[index] = combo;
    return combo;
  }
  return apiUpdateMealCombo(combo);
}

export async function deleteMealComboData(id: number): Promise<MealCombo> {
  if (isDevelopment) {
    const index = sampleMealCombos.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Meal combo not found');
    const deleted = sampleMealCombos[index];
    sampleMealCombos.splice(index, 1);
    return deleted;
  }
  return apiDeleteMealCombo(id);
} 