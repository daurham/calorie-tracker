// api/get-data.js
import { Pool } from 'pg';


export default async function handler(req, res) {
  console.log("process.env.DATABASE_URL", process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Set this in Vercel dashboard or .env
    ssl: {
      rejectUnauthorized: false, // required for NeonDB
    },
  });

  console.log("fetching data");
  try {
    const result = await pool.query('SELECT * FROM ingredients ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('DB error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
