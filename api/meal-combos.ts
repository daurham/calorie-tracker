import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const result = await sql`SELECT * FROM meal_combos ORDER BY name`;
        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching meal combos:', error);
        res.status(500).json({ error: 'Failed to fetch meal combos' });
      }
      break;

    case 'POST':
      try {
        const { name, ingredients, calories, protein, carbs, fat, notes, instructions } = req.body;
        const result = await sql`
          INSERT INTO meal_combos (name, ingredients, calories, protein, carbs, fat, notes, instructions)
          VALUES (${name}, ${ingredients}, ${calories}, ${protein}, ${carbs}, ${fat}, ${notes}, ${instructions})
          RETURNING *
        `;
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error adding meal combo:', error);
        res.status(500).json({ error: 'Failed to add meal combo' });
      }
      break;

    case 'PUT':
      try {
        const { id, name, ingredients, calories, protein, carbs, fat, notes, instructions } = req.body;
        const result = await sql`
          UPDATE meal_combos 
          SET name = ${name},
              ingredients = ${ingredients},
              calories = ${calories},
              protein = ${protein},
              carbs = ${carbs},
              fat = ${fat},
              notes = ${notes},
              instructions = ${instructions},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
          RETURNING *
        `;
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Meal combo not found' });
        } else {
          res.status(200).json(result.rows[0]);
        }
      } catch (error) {
        console.error('Error updating meal combo:', error);
        res.status(500).json({ error: 'Failed to update meal combo' });
      }
      break;

    case 'DELETE':
      try {
        const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
        if (!id) {
          res.status(400).json({ error: 'ID is required' });
          return;
        }
        const result = await sql`
          DELETE FROM meal_combos 
          WHERE id = ${id}
          RETURNING *
        `;
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Meal combo not found' });
        } else {
          res.status(200).json(result.rows[0]);
        }
      } catch (error) {
        console.error('Error deleting meal combo:', error);
        res.status(500).json({ error: 'Failed to delete meal combo' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 