// Secure AI Ingredient Recognition Service (Backend Proxy)
import { isAIAuthenticated } from './auth';
import { AI_CONFIG } from './config';

interface IngredientAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  confidence: number;
  description: string;
}

export const analyzeIngredientDescription = async (
  description: string, 
  servingType: 'serving' | 'whole' = 'serving'
): Promise<IngredientAnalysisResult> => {
  if (!isAIAuthenticated()) {
    throw new Error('AI features require authentication');
  }

  // For development, use mock data
  if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
    console.log('Using mock data for ingredient analysis, VITE_USE_MOCK_DATA:', import.meta.env.VITE_USE_MOCK_DATA);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          name: "Red Bell Pepper",
          calories: 31,
          protein: 1.0,
          carbs: 7.3,
          fat: 0.3,
          unit: "1 medium (119g)",
          confidence: 0.85,
          description: "Based on your description, this appears to be a red bell pepper. Nutritional values are per medium-sized pepper."
        });
      }, 2000);
    });
  }

  try {
    // Call the ingredient analysis API endpoint
    const response = await fetch('/api/analyze-ingredient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        description,
        servingType 
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Ingredient analysis failed:', error);
    throw new Error('Failed to analyze ingredient description. Please try again.');
  }
};


