import { sql } from '@vercel/postgres';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Helper function to get a single row
export async function getRow(text: string, params?: any[]) {
  const res = await query(text, params);
  return res.rows[0];
}

// Helper function to get multiple rows
export async function getRows(text: string, params?: any[]) {
  const res = await query(text, params);
  return res.rows;
}

// Export the pool for direct access if needed
export { pool }; 