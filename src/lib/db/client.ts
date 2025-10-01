import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Log the environment for debugging
console.log('Environment:', {
  MODE: process.env.MODE,
  POSTGRES_URL: process.env.POSTGRES_URL,
});

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.MODE === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test the connection
pool.connect()
  .then(() => console.log('Successfully connected to the database'))
  .catch(err => console.error('Error connecting to the database:', err));

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