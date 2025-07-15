import { query } from '../src/lib/db/client';

async function addMealTypeColumn() {
  try {
    console.log('Starting migration: Adding meal_type column to meal_combos table...');
    
    // Add the meal_type column with a default value of 'composed'
    await query(`
      ALTER TABLE meal_combos 
      ADD COLUMN IF NOT EXISTS meal_type VARCHAR(20) DEFAULT 'composed'
    `);
    
    // Add the check constraint
    await query(`
      ALTER TABLE meal_combos 
      ADD CONSTRAINT meal_type_check 
      CHECK (meal_type IN ('composed', 'standalone'))
    `);
    
    // Update existing meal_combos to have meal_type = 'composed'
    await query(`
      UPDATE meal_combos 
      SET meal_type = 'composed' 
      WHERE meal_type IS NULL
    `);
    
    console.log('✅ Successfully added meal_type column to meal_combos table');
    
    // Show summary
    const result = await query(`
      SELECT 
        COUNT(*) as total_meals,
        COUNT(CASE WHEN meal_type = 'composed' THEN 1 END) as composed_meals,
        COUNT(CASE WHEN meal_type = 'standalone' THEN 1 END) as standalone_meals
      FROM meal_combos
    `);
    
    const summary = result.rows[0];
    console.log('\n📊 Migration Summary:');
    console.log(`Total meals: ${summary.total_meals}`);
    console.log(`Composed meals: ${summary.composed_meals}`);
    console.log(`Standalone meals: ${summary.standalone_meals}`);
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

addMealTypeColumn(); 