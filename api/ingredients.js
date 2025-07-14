import { sql } from '@vercel/postgres';

async function getIngredients(req, res) {
  try {
    const result = await sql.query('SELECT * FROM ingredients ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch ingredients',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createIngredient(req, res) {
  try {
    const { name, calories, protein, carbs, fat, unit, is_staple = false } = req.body;
    const result = await sql.query(
      'INSERT INTO ingredients (name, calories, protein, carbs, fat, unit, is_staple) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, calories, protein, carbs, fat, unit, is_staple]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding ingredient:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ 
      error: 'Failed to add ingredient',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateIngredient(req, res) {
  try {
    const { id, name, calories, protein, carbs, fat, unit, is_staple } = req.body;
    const result = await sql.query(
      'UPDATE ingredients SET name = $1, calories = $2, protein = $3, carbs = $4, fat = $5, unit = $6, is_staple = $7 WHERE id = $8 RETURNING *',
      [name, calories, protein, carbs, fat, unit, is_staple, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Ingredient not found' });
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating ingredient:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ 
      error: 'Failed to update ingredient',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function deleteIngredient(req, res) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      res.status(400).json({ error: 'ID is required' });
      return;
    }

    // Check if ingredient is in use by meal combos
    const usageCheck = await sql.query(
      `SELECT mc.id, mc.name 
       FROM meal_combos mc 
       JOIN meal_combo_ingredients mci ON mc.id = mci.meal_combo_id 
       WHERE mci.ingredient_id = $1`,
      [id]
    );

    if (usageCheck.rows.length > 0) {
      const mealCombos = usageCheck.rows.map(row => row.name);
      res.status(409).json({ 
        error: 'Cannot delete ingredient while in use',
        message: `This ingredient is currently used in ${usageCheck.rows.length} meal combo(s): ${mealCombos.join(', ')}`,
        suggestions: [
          'Update the ingredient instead of deleting it',
          'Update the meal combo(s) to use a different ingredient',
          'Delete the meal combo(s) first, then delete this ingredient'
        ],
        mealCombos: usageCheck.rows
      });
      return;
    }

    const result = await sql.query(
      'DELETE FROM ingredients WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Ingredient not found' });
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ 
      error: 'Failed to delete ingredient',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default async function handler(req, res) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const methodHandlers = {
    GET: getIngredients,
    POST: createIngredient,
    PUT: updateIngredient,
    DELETE: deleteIngredient
  };

  const handler = methodHandlers[req.method];
  if (!handler) {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  await handler(req, res);
} 