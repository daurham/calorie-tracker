import { query } from './client';
import { sql } from '@vercel/postgres';
import { Ingredient, MealCombo } from '@/types';

// Schema creation
export async function createTables() {
  try {
    // Drop the ingredients column if it exists
    await sql.query(`
      ALTER TABLE meal_combos DROP COLUMN IF EXISTS ingredients;
    `);

    // Create ingredients table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        calories INTEGER NOT NULL,
        protein DECIMAL(5,2) NOT NULL,
        carbs DECIMAL(5,2) NOT NULL,
        fat DECIMAL(5,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        is_staple BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create meal_combos table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS meal_combos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        meal_type VARCHAR(20) NOT NULL DEFAULT 'composed' CHECK (meal_type IN ('composed', 'standalone')),
        calories INTEGER NOT NULL,
        protein DECIMAL(5,2) NOT NULL,
        carbs DECIMAL(5,2) NOT NULL,
        fat DECIMAL(5,2) NOT NULL,
        notes TEXT,
        instructions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create meal_combo_ingredients junction table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS meal_combo_ingredients (
        meal_combo_id INTEGER REFERENCES meal_combos(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
        quantity DECIMAL(5,2) NOT NULL DEFAULT 1,
        PRIMARY KEY (meal_combo_id, ingredient_id)
      )
    `);

    // Create trigger function for meal_combo_ingredients changes
    await sql.query(`
      CREATE OR REPLACE FUNCTION update_meal_combo_totals()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE meal_combos
        SET 
          calories = (
            SELECT COALESCE(SUM(i.calories * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = NEW.meal_combo_id
          ),
          protein = (
            SELECT COALESCE(SUM(i.protein * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = NEW.meal_combo_id
          ),
          carbs = (
            SELECT COALESCE(SUM(i.carbs * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = NEW.meal_combo_id
          ),
          fat = (
            SELECT COALESCE(SUM(i.fat * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = NEW.meal_combo_id
          )
        WHERE id = NEW.meal_combo_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Create trigger function for ingredient updates
    await sql.query(`
      CREATE OR REPLACE FUNCTION update_meal_combos_on_ingredient_change()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update all meal combos that use this ingredient
        UPDATE meal_combos mc
        SET 
          calories = (
            SELECT COALESCE(SUM(i.calories * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = mc.id
          ),
          protein = (
            SELECT COALESCE(SUM(i.protein * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = mc.id
          ),
          carbs = (
            SELECT COALESCE(SUM(i.carbs * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = mc.id
          ),
          fat = (
            SELECT COALESCE(SUM(i.fat * mci.quantity), 0)
            FROM meal_combo_ingredients mci
            JOIN ingredients i ON i.id = mci.ingredient_id
            WHERE mci.meal_combo_id = mc.id
          )
        WHERE EXISTS (
          SELECT 1
          FROM meal_combo_ingredients mci
          WHERE mci.meal_combo_id = mc.id
          AND mci.ingredient_id = NEW.id
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Drop existing triggers if they exist
    await sql.query(`
      DROP TRIGGER IF EXISTS update_meal_combo_totals_trigger ON meal_combo_ingredients
    `);

    await sql.query(`
      DROP TRIGGER IF EXISTS update_meal_combos_on_ingredient_change_trigger ON ingredients
    `);

    // Create triggers
    await sql.query(`
      CREATE TRIGGER update_meal_combo_totals_trigger
      AFTER INSERT OR UPDATE OR DELETE ON meal_combo_ingredients
      FOR EACH ROW
      EXECUTE FUNCTION update_meal_combo_totals()
    `);

    await sql.query(`
      CREATE TRIGGER update_meal_combos_on_ingredient_change_trigger
      AFTER UPDATE ON ingredients
      FOR EACH ROW
      EXECUTE FUNCTION update_meal_combos_on_ingredient_change()
    `);

    console.log('Database tables and triggers created successfully');
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
  const { name, calories, protein, carbs, fat, unit, is_staple = false } = ingredient;
  const result = await query(
    'INSERT INTO ingredients (name, calories, protein, carbs, fat, unit, is_staple) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, calories, protein, carbs, fat, unit, is_staple]
  );
  return result.rows[0] as Ingredient;
}

export async function addMealCombo(mealCombo: Omit<MealCombo, 'id'>): Promise<MealCombo> {
  const { name, calories, protein, carbs, fat, notes, instructions } = mealCombo;
  const result = await query(
    'INSERT INTO meal_combos (name, calories, protein, carbs, fat, notes, instructions) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, calories, protein, carbs, fat, notes, instructions]
  );
  return result.rows[0] as MealCombo;
} 