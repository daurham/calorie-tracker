import { query } from './client';

// Types
export interface Ingredient {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
}

export interface MealCombo {
  id: number;
  name: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  instructions?: string;
}

// Schema creation
export async function createTables() {
  try {
    // Create ingredients table
    await query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        calories INTEGER NOT NULL,
        protein DECIMAL(5,2) NOT NULL,
        carbs DECIMAL(5,2) NOT NULL,
        fat DECIMAL(5,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create meal_combos table
    await query(`
      CREATE TABLE IF NOT EXISTS meal_combos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        ingredients TEXT[] NOT NULL,
        calories INTEGER NOT NULL,
        protein DECIMAL(5,2) NOT NULL,
        carbs DECIMAL(5,2) NOT NULL,
        fat DECIMAL(5,2) NOT NULL,
        notes TEXT,
        instructions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

// Data access functions
export async function getIngredients(): Promise<Ingredient[]> {
  const result = await query('SELECT * FROM ingredients ORDER BY name');
  return result.rows as Ingredient[];
}

export async function getMealCombos(): Promise<MealCombo[]> {
  const result = await query('SELECT * FROM meal_combos ORDER BY name');
  return result.rows as MealCombo[];
}

export async function addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  const { name, calories, protein, carbs, fat, unit } = ingredient;
  const result = await query(
    'INSERT INTO ingredients (name, calories, protein, carbs, fat, unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, calories, protein, carbs, fat, unit]
  );
  return result.rows[0] as Ingredient;
}

export async function addMealCombo(mealCombo: Omit<MealCombo, 'id'>): Promise<MealCombo> {
  const { name, ingredients, calories, protein, carbs, fat, notes, instructions } = mealCombo;
  const result = await query(
    'INSERT INTO meal_combos (name, ingredients, calories, protein, carbs, fat, notes, instructions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [name, ingredients, calories, protein, carbs, fat, notes, instructions]
  );
  return result.rows[0] as MealCombo;
} 