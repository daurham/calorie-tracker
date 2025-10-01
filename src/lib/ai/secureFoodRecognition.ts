// Secure AI Food Recognition Service (Backend Proxy)
import { isAIAuthenticated } from './auth';
import { AI_CONFIG } from './config';

interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  description: string;
}

export const analyzeFoodDescription = async (description: string): Promise<FoodAnalysisResult> => {
  if (!isAIAuthenticated()) {
    throw new Error('AI features require authentication');
  }

  // For development, use mock data
  if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
    console.log('Using mock data, VITE_USE_MOCK_DATA:', import.meta.env.VITE_USE_MOCK_DATA);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          name: "Grilled Chicken Breast",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          confidence: 0.85,
          description: "Based on your description, this appears to be a grilled chicken breast."
        });
      }, 2000);
    });
  }

  try {
    // Call your backend API endpoint instead of Gemini directly
    const response = await fetch(AI_CONFIG.BACKEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Food analysis failed:', error);
    throw new Error('Failed to analyze food description. Please try again.');
  }
};
