import { query } from '../src/lib/db/client';
import { FOOD_LOG_SCHEMA_STATEMENTS } from '../src/lib/db/food-logs-schema';

async function addFoodLogs() {
  try {
    console.log('Starting migration: creating food_log_groups and food_logs...');

    for (const statement of FOOD_LOG_SCHEMA_STATEMENTS) {
      await query(statement);
    }

    const groups = await query('SELECT COUNT(*)::int AS count FROM food_log_groups');
    const logs = await query('SELECT COUNT(*)::int AS count FROM food_logs');

    console.log('✅ food_log_groups and food_logs are ready');
    console.log(`Existing groups: ${groups.rows[0].count}`);
    console.log(`Existing logs: ${logs.rows[0].count}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating food log tables:', error);
    process.exit(1);
  }
}

addFoodLogs();
