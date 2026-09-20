import { query } from '../src/lib/db/client';
import { FOODS_SCHEMA_STATEMENTS } from '../src/lib/db/foods-schema';

async function addFoods() {
  try {
    console.log('Starting migration: creating foods table...');

    for (const statement of FOODS_SCHEMA_STATEMENTS) {
      await query(statement);
    }

    const result = await query('SELECT COUNT(*)::int AS count FROM foods');
    console.log('✅ foods table is ready');
    console.log(`Existing foods: ${result.rows[0].count}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating foods table:', error);
    process.exit(1);
  }
}

addFoods();
