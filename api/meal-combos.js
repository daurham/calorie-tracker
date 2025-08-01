import { sql } from '@vercel/postgres';

async function getMealCombos(req, res) {
  try {
    const result = await sql`
      SELECT mc.*, 
             json_agg(json_build_object(
               'id', i.id,
               'quantity', mci.quantity
             )) as ingredients
      FROM meal_combos mc
      LEFT JOIN meal_combo_ingredients mci ON mc.id = mci.meal_combo_id
      LEFT JOIN ingredients i ON mci.ingredient_id = i.id
      GROUP BY mc.id
      ORDER BY mc.name
    `;
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching meal combos:', error);
    res.status(500).json({ error: 'Failed to fetch meal combos' });
  }
}

async function createMealCombo(req, res) {
  try {
    const { name, meal_type = 'composed', ingredients, calories, protein, carbs, fat, notes, instructions } = req.body;
    
    // Start a transaction
    await sql`BEGIN`;
    
    // Try to drop the ingredients column if it exists
    try {
      await sql`ALTER TABLE meal_combos DROP COLUMN IF EXISTS ingredients`;
    } catch (error) {
      console.log('Error dropping ingredients column:', error);
      // Continue anyway as the column might not exist
    }
    
    // Insert the meal combo
    const result = await sql`
      INSERT INTO meal_combos (name, meal_type, calories, protein, carbs, fat, notes, instructions)
      VALUES (${name}, ${meal_type}, ${calories}, ${protein}, ${carbs}, ${fat}, ${notes}, ${instructions})
      RETURNING *
    `;
    
    const mealCombo = result.rows[0];
    
    // Insert the ingredients only for composed meals
    if (meal_type === 'composed' && ingredients && Array.isArray(ingredients)) {
      for (const ingredient of ingredients) {
        await sql`
          INSERT INTO meal_combo_ingredients (meal_combo_id, ingredient_id, quantity)
          VALUES (${mealCombo.id}, ${ingredient.id}, ${ingredient.quantity})
        `;
      }
    }
    
    await sql`COMMIT`;
    
    // Get the complete meal combo with ingredients
    const finalResult = await sql`
      SELECT mc.*, 
             json_agg(json_build_object(
               'id', i.id,
               'name', i.name,
               'quantity', mci.quantity
             )) as ingredients
      FROM meal_combos mc
      LEFT JOIN meal_combo_ingredients mci ON mc.id = mci.meal_combo_id
      LEFT JOIN ingredients i ON mci.ingredient_id = i.id
      WHERE mc.id = ${mealCombo.id}
      GROUP BY mc.id
    `;
    
    res.status(201).json(finalResult.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.log("req.body", req.body);
    console.error('Error adding meal combo:', error);
    res.status(500).json({ error: 'Failed to add meal combo' });
  }
}

async function updateMealCombo(req, res) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      res.status(400).json({ error: 'ID is required' });
      return;
    }

    const { name, meal_type = 'composed', ingredients, calories, protein, carbs, fat, notes, instructions } = req.body;
    
    // Start a transaction
    await sql`BEGIN`;
    
    // Update the meal combo
    const result = await sql`
      UPDATE meal_combos 
      SET name = ${name},
          meal_type = ${meal_type},
          calories = ${calories},
          protein = ${protein},
          carbs = ${carbs},
          fat = ${fat},
          notes = ${notes},
          instructions = ${instructions}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.rows.length === 0) {
      await sql`ROLLBACK`;
      res.status(404).json({ error: 'Meal combo not found' });
      return;
    }
    
    // Delete existing ingredients
    await sql`
      DELETE FROM meal_combo_ingredients
      WHERE meal_combo_id = ${id}
    `;
    
    // Insert the new ingredients only for composed meals
    if (meal_type === 'composed' && ingredients && Array.isArray(ingredients)) {
      for (const ingredient of ingredients) {
        await sql`
          INSERT INTO meal_combo_ingredients (meal_combo_id, ingredient_id, quantity)
          VALUES (${id}, ${ingredient.id}, ${ingredient.quantity})
        `;
      }
    }
    
    await sql`COMMIT`;
    
    // Get the complete meal combo with ingredients
    const finalResult = await sql`
      SELECT mc.*, 
             json_agg(json_build_object(
               'id', i.id,
               'name', i.name,
               'quantity', mci.quantity
             )) as ingredients
      FROM meal_combos mc
      LEFT JOIN meal_combo_ingredients mci ON mc.id = mci.meal_combo_id
      LEFT JOIN ingredients i ON mci.ingredient_id = i.id
      WHERE mc.id = ${id}
      GROUP BY mc.id
    `;
    
    res.status(200).json(finalResult.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error updating meal combo:', error);
    res.status(500).json({ error: 'Failed to update meal combo' });
  }
}

async function deleteMealCombo(req, res) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id) {
      res.status(400).json({ error: 'ID is required' });
      return;
    }
    
    // Start a transaction
    await sql`BEGIN`;
    
    // Delete the meal combo (this will cascade delete the ingredients)
    const result = await sql`
      DELETE FROM meal_combos 
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.rows.length === 0) {
      await sql`ROLLBACK`;
      res.status(404).json({ error: 'Meal combo not found' });
      return;
    }
    
    await sql`COMMIT`;
    res.status(200).json(result.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error deleting meal combo:', error);
    res.status(500).json({ error: 'Failed to delete meal combo' });
  }
}

export default async function handler(req, res) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const methodHandlers = {
    GET: getMealCombos,
    POST: createMealCombo,
    PUT: updateMealCombo,
    DELETE: deleteMealCombo
  };

  const handler = methodHandlers[req.method];
  if (!handler) {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  await handler(req, res);
} 