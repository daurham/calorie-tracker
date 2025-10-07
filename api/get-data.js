// This is for testing purposes only.
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

export default async function handler(req, res) {
  const pool = new Pool({
    connectionString: DATABASE_URL, // Set this in Vercel dashboard or .env
    ssl: {
      rejectUnauthorized: false, // required for NeonDB
    },
  });

  console.log("fetching data");
  try {
    const result = await pool.query('SELECT * FROM ingredients ORDER BY name');
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('DB error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
