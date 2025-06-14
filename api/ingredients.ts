import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const result = await sql`SELECT * FROM ingredients ORDER BY name`;
        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({ error: 'Failed to fetch ingredients' });
      }
      break;

    case 'POST':
      try {
        const { name, calories, protein, carbs, fat, unit } = req.body;
        const result = await sql`
          INSERT INTO ingredients (name, calories, protein, carbs, fat, unit)
          VALUES (${name}, ${calories}, ${protein}, ${carbs}, ${fat}, ${unit})
          RETURNING *
        `;
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error adding ingredient:', error);
        res.status(500).json({ error: 'Failed to add ingredient' });
      }
      break;

    case 'PUT':
      try {
        const { id, name, calories, protein, carbs, fat, unit } = req.body;
        const result = await sql`
          UPDATE ingredients 
          SET name = ${name},
              calories = ${calories},
              protein = ${protein},
              carbs = ${carbs},
              fat = ${fat},
              unit = ${unit},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
          RETURNING *
        `;
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Ingredient not found' });
        } else {
          res.status(200).json(result.rows[0]);
        }
      } catch (error) {
        console.error('Error updating ingredient:', error);
        res.status(500).json({ error: 'Failed to update ingredient' });
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
          DELETE FROM ingredients 
          WHERE id = ${id}
          RETURNING *
        `;
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Ingredient not found' });
        } else {
          res.status(200).json(result.rows[0]);
        }
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        res.status(500).json({ error: 'Failed to delete ingredient' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 