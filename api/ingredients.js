// import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      try {
        console.log('Attempting to fetch ingredients...');
        const result = await sql.query('SELECT * FROM ingredients ORDER BY name');
        console.log('Successfully fetched ingredients:', result.rows.length);
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
      break;

    case 'POST':
      try {
        const { name, calories, protein, carbs, fat, unit } = req.body;
        const result = await sql.query(
          'INSERT INTO ingredients (name, calories, protein, carbs, fat, unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [name, calories, protein, carbs, fat, unit]
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
      break;

    case 'PUT':
      try {
        const { id, name, calories, protein, carbs, fat, unit } = req.body;
        const result = await sql.query(
          'UPDATE ingredients SET name = $1, calories = $2, protein = $3, carbs = $4, fat = $5, unit = $6 WHERE id = $7 RETURNING *',
          [name, calories, protein, carbs, fat, unit, id]
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
      break;

    case 'DELETE':
      try {
        const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
        if (!id) {
          res.status(400).json({ error: 'ID is required' });
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
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 