import { getRows } from "../src/lib/db/client";
import fs from 'fs';
import path from 'path';

async function backupDatabase() {
  try {
    // Get all data directly from database
    const ingredients = await getRows('SELECT * FROM ingredients');
    const mealCombos = await getRows(`
      SELECT m.*, json_agg(json_build_object(
        'id', i.id,
        'name', i.name,
        'quantity', mi.quantity
      )) as ingredients
      FROM meal_combos m
      LEFT JOIN meal_combo_ingredients mi ON m.id = mi.meal_combo_id
      LEFT JOIN ingredients i ON mi.ingredient_id = i.id
      GROUP BY m.id
    `);

    const backupData = {
      ingredients,
      mealCombos,
      timestamp: new Date().toISOString()
    };

    // Create backups directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'data-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Create backup file with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = path.join(backupDir, `calorie-tracker-backup-${timestamp}.json`);
    
    // Write backup file
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log(`Backup created successfully at: ${backupPath}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating backup:', error);
    process.exit(1);
  }
}

backupDatabase(); 