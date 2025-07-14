import { query } from '../src/lib/db/client';

async function addStapleColumn() {
  try {
    console.log('Starting migration: Adding isStaple column to ingredients table...');
    
    // Add the isStaple column with a default value of false
    await query(`
      ALTER TABLE ingredients 
      ADD COLUMN IF NOT EXISTS is_staple BOOLEAN DEFAULT false
    `);
    
    console.log('✅ Successfully added is_staple column to ingredients table');
    
    // Update existing ingredients to set is_staple based on common staples
    const commonStaples = [
      'egg'
    ];
    
    // Update ingredients that match common staples
    for (const staple of commonStaples) {
      await query(`
        UPDATE ingredients 
        SET is_staple = true 
        WHERE LOWER(name) LIKE $1
      `, [`%${staple}%`]);
    }
    
    console.log('✅ Updated existing ingredients with staple classification');
    
    // Show summary
    const result = await query(`
      SELECT 
        COUNT(*) as total_ingredients,
        COUNT(CASE WHEN is_staple = true THEN 1 END) as staple_ingredients,
        COUNT(CASE WHEN is_staple = false THEN 1 END) as non_staple_ingredients
      FROM ingredients
    `);
    
    const summary = result.rows[0];
    console.log('\n📊 Migration Summary:');
    console.log(`Total ingredients: ${summary.total_ingredients}`);
    console.log(`Staple ingredients: ${summary.staple_ingredients}`);
    console.log(`Non-staple ingredients: ${summary.non_staple_ingredients}`);
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

addStapleColumn(); 