import { MealPlanPromptGenerator } from '../src/lib/meal-planning/prompt-generator.js';

async function generateMealPlanPrompt(req, res) {
  try {
    const { userGoals } = req.body;
    
    console.log('Generating meal plan prompt...');
    
    // Use the modular prompt generator
    const { prompt, data } = await MealPlanPromptGenerator.generateCompletePrompt(userGoals);
    
    console.log(`Generated prompt with ${data.totalIngredients} ingredients and ${data.totalMeals} meals`);
    
    res.status(200).json({
      prompt,
      summary: {
        totalIngredients: data.totalIngredients,
        totalMeals: data.totalMeals,
        ingredients: data.ingredients,
        meals: data.meals
      }
    });
  } catch (error) {
    console.error('Error generating meal plan prompt:', error);
    res.status(500).json({ 
      error: 'Failed to generate meal plan prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default async function handler(req, res) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  await generateMealPlanPrompt(req, res);
} 