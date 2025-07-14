import { MealPlanPromptGenerator } from "../src/lib/meal-planning/prompt-generator";
import fs from 'fs';
import path from 'path';

async function generateMealPlanPrompt() {
  try {
    console.log('Fetching data from database...');
    
    // Check if staples-only flag is provided
    const staplesOnly = process.argv.includes('--staples-only');
    
    // Use the modular prompt generator
    const { prompt, data } = await MealPlanPromptGenerator.generateCompletePrompt(undefined, staplesOnly);
    
    console.log(`Found ${data.totalIngredients} ingredients and ${data.totalMeals} meal combos${staplesOnly ? ' (staples only)' : ''}`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Write the prompt to a file
    const timestamp = new Date().toISOString().split('T')[0];
    const outputPath = path.join(outputDir, `meal-plan-prompt-${timestamp}.txt`);
    
    fs.writeFileSync(outputPath, prompt);
    
    console.log(`Meal plan prompt generated successfully at: ${outputPath}`);
    console.log(`\nSummary:`);
    console.log(`- ${data.totalIngredients} ingredients available${staplesOnly ? ' (staples only)' : ''}`);
    console.log(`- ${data.totalMeals} existing meals${staplesOnly ? ' (staples only)' : ''}`);
    console.log(`- Prompt saved to: ${outputPath}`);
    if (staplesOnly) {
      console.log(`- Mode: Staples-only filtering enabled`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating meal plan prompt:', error);
    process.exit(1);
  }
}

generateMealPlanPrompt(); 