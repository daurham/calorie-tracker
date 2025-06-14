import { sql } from '@vercel/postgres';
import { Pool } from 'pg';

console.log('process.env.POSTGRES_URL', import.meta.env.POSTGRES_URL);

// Create a connection pool
const pool = new Pool({
  connectionString: import.meta.env.POSTGRES_URL,
  ssl: import.meta.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
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