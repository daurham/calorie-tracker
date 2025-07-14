import { MealPlanPromptGenerator } from './prompt-generator';

/**
 * Example 1: Generate a basic prompt without user goals
 */
export async function generateBasicPrompt(staplesOnly: boolean = false) {
  try {
    const { prompt, data } = await MealPlanPromptGenerator.generateCompletePrompt(undefined, staplesOnly);
    
    console.log('Generated prompt with:', {
      ingredients: data.totalIngredients,
      meals: data.totalMeals,
      staplesOnly
    });
    
    return prompt;
  } catch (error) {
    console.error('Error generating basic prompt:', error);
    throw error;
  }
}

/**
 * Example 2: Generate a prompt with specific user goals
 */
export async function generatePromptWithGoals(userGoals: string, staplesOnly: boolean = false) {
  try {
    const { prompt, data } = await MealPlanPromptGenerator.generateCompletePrompt(userGoals, staplesOnly);
    
    console.log('Generated personalized prompt with:', {
      ingredients: data.totalIngredients,
      meals: data.totalMeals,
      hasGoals: !!userGoals,
      staplesOnly
    });
    
    return { prompt, data };
  } catch (error) {
    console.error('Error generating prompt with goals:', error);
    throw error;
  }
}

/**
 * Example 3: Get just the data without generating a prompt
 */
export async function getMealPlanData() {
  try {
    const data = await MealPlanPromptGenerator.fetchMealPlanData();
    
    console.log('Fetched meal plan data:', {
      ingredients: data.totalIngredients,
      meals: data.totalMeals
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching meal plan data:', error);
    throw error;
  }
}

/**
 * Example 4: Generate a prompt from existing data
 */
export function generatePromptFromData(data: any, userGoals?: string) {
  try {
    const prompt = MealPlanPromptGenerator.generatePrompt(data, userGoals);
    
    console.log('Generated prompt from existing data');
    
    return prompt;
  } catch (error) {
    console.error('Error generating prompt from data:', error);
    throw error;
  }
}

/**
 * Example 5: Batch generate prompts for different scenarios
 */
export async function generateMultiplePrompts() {
  const scenarios = [
    { name: 'Weight Loss', goals: 'I want to lose weight with 1800 calories, 150g protein, 150g carbs, 60g fat' },
    { name: 'Muscle Building', goals: 'I want to build muscle with 2500 calories, 200g protein, 250g carbs, 80g fat' },
    { name: 'Maintenance', goals: 'I want to maintain my weight with 2200 calories, 160g protein, 200g carbs, 70g fat' }
  ];

  const results = [];

  for (const scenario of scenarios) {
    try {
      const { prompt, data } = await MealPlanPromptGenerator.generateCompletePrompt(scenario.goals, false);
      results.push({
        scenario: scenario.name,
        prompt,
        summary: {
          ingredients: data.totalIngredients,
          meals: data.totalMeals
        }
      });
    } catch (error) {
      console.error(`Error generating prompt for ${scenario.name}:`, error);
    }
  }

  return results;
} 