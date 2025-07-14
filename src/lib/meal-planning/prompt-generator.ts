import { getRows } from "../db/client";
import { Ingredient, MealCombo, MealPlanData } from '@/types';

export class MealPlanPromptGenerator {
  /**
   * Fetches all ingredients and meals from the database
   */
  static async fetchMealPlanData(staplesOnly: boolean = false): Promise<MealPlanData> {
    // Fetch ingredients (filtered by staples if requested)
    const ingredientsQuery = staplesOnly 
      ? 'SELECT * FROM ingredients WHERE is_staple = true ORDER BY name'
      : 'SELECT * FROM ingredients ORDER BY name';
    const ingredients = await getRows(ingredientsQuery) as Ingredient[];
    
    // Fetch all meal combos with their ingredients
    let mealCombosQuery;
    
    if (staplesOnly) {
      // For staples-only, first get meals that contain only staple ingredients
      mealCombosQuery = `
        SELECT mc.*, 
               json_agg(json_build_object(
                 'id', i.id,
                 'name', i.name,
                 'quantity', mci.quantity
               )) as ingredients
        FROM meal_combos mc
        INNER JOIN meal_combo_ingredients mci ON mc.id = mci.meal_combo_id
        INNER JOIN ingredients i ON mci.ingredient_id = i.id
        WHERE i.is_staple = true
        AND mc.id NOT IN (
          SELECT DISTINCT mci2.meal_combo_id 
          FROM meal_combo_ingredients mci2 
          JOIN ingredients i2 ON mci2.ingredient_id = i2.id 
          WHERE i2.is_staple = false
        )
        GROUP BY mc.id
        ORDER BY mc.name
      `;
    } else {
      // For all ingredients, use the original query
      mealCombosQuery = `
        SELECT mc.*, 
               json_agg(json_build_object(
                 'id', i.id,
                 'name', i.name,
                 'quantity', mci.quantity
               )) as ingredients
        FROM meal_combos mc
        LEFT JOIN meal_combo_ingredients mci ON mc.id = mci.meal_combo_id
        LEFT JOIN ingredients i ON mci.ingredient_id = i.id
        GROUP BY mc.id
        ORDER BY mc.name
      `;
    }
    
    const mealCombos = await getRows(mealCombosQuery) as MealCombo[];
    
    // Condense ingredients information
    const condensedIngredients = ingredients.map(ing => ({
      name: ing.name,
      macros: `${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`,
      unit: ing.unit,
      is_staple: ing.is_staple || false
    }));
    
    // Condense meal combos information
    const condensedMeals = mealCombos.map(meal => ({
      name: meal.name,
      macros: `${meal.calories} cal, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat`,
      ingredients: meal.ingredients.map(ing => `${ing.name} (${ing.quantity})`).join(', '),
      notes: meal.notes || '',
      instructions: meal.instructions || ''
    }));
    
    return {
      ingredients: condensedIngredients,
      meals: condensedMeals,
      totalIngredients: ingredients.length,
      totalMeals: mealCombos.length
    };
  }

  /**
   * Generates a meal plan prompt from the provided data
   */
  static generatePrompt(data: MealPlanData, userGoals?: string): string {
    const ingredientsList = data.ingredients.map(ing => 
      `- ${ing.name}: ${ing.macros} per ${ing.unit}`
    ).join('\n');

    const mealsList = data.meals.map(meal => 
      `- ${meal.name}: ${meal.macros}
  Ingredients: ${meal.ingredients}
  ${meal.notes ? `Notes: ${meal.notes}` : ''}
  ${meal.instructions ? `Instructions: ${meal.instructions}` : ''}`
    ).join('\n\n');

    // Extract macro goals from user goals if they contain them
    let macroGoalsSection = '';
    if (userGoals) {
      // Check if the user goals contain macro information
      const macroMatch = userGoals.match(/(\d+)\s*calories.*?(\d+)g\s*protein.*?(\d+)g\s*carbs.*?(\d+)g\s*fat/i);
      if (macroMatch) {
        const [, calories, protein, carbs, fat] = macroMatch;
        macroGoalsSection = `\nMY MACRO GOALS:
- Daily Calories: ${calories}
- Protein: ${protein}g
- Carbs: ${carbs}g  
- Fat: ${fat}g\n`;
      }
    }

    const goalsSection = userGoals ? `\nMY GOALS:\n${userGoals}\n` : '';

    // Generate context-aware prompt based on number of meals
    let mealsContext = '';
    let suggestions = '';
    
    if (data.totalMeals === 0) {
      mealsContext = `I haven't created any meals yet, so I'm starting fresh with just my available ingredients.`;
      suggestions = `Please suggest:
- Multiple meal combinations using my available ingredients
- Simple recipes that I can easily prepare
- A variety of meal types (breakfast, lunch, dinner, snacks)
- Meal prep strategies for the week
- Tips for building a meal rotation system`;
    } else if (data.totalMeals < 4) {
      mealsContext = `I have only created ${data.totalMeals} meal(s) so far, so I'm looking to expand my meal repertoire.`;
      suggestions = `Please suggest:
- Additional meal combinations using my ingredients
- Variations and modifications to my existing meals
- New recipes that complement what I already have
- A weekly meal plan structure
- Tips for meal prep and planning`;
    } else {
      mealsContext = `I have a good collection of meals to work with.`;
      suggestions = `Please suggest:
- New meal combinations using my ingredients
- Modifications to existing meals
- A weekly meal plan structure
- Tips for meal prep and planning`;
    }

    return `Given these ingredients, my goal macros and these meals I have already made, help me come up with a meal plan to reach my goals.${goalsSection}${macroGoalsSection}

AVAILABLE INGREDIENTS:
${ingredientsList}

EXISTING MEALS I'VE MADE:
${data.totalMeals > 0 ? mealsList : 'None yet - I\'m starting fresh!'}

CONTEXT: ${mealsContext}

Please help me create a meal plan that:
1. Uses the available ingredients
2. ${data.totalMeals > 0 ? 'Builds on the meals I\'ve already created' : 'Creates new meals from scratch'}
3. Helps me reach my macro goals
4. Provides variety and nutrition
5. Is practical and easy to prepare

${suggestions}`;
  }

  /**
   * Fetches data and generates a complete prompt
   */
  static async generateCompletePrompt(userGoals?: string, staplesOnly: boolean = false): Promise<{
    prompt: string;
    data: MealPlanData;
  }> {
    const data = await this.fetchMealPlanData(staplesOnly);
    const prompt = this.generatePrompt(data, userGoals);
    
    return { prompt, data };
  }
} 