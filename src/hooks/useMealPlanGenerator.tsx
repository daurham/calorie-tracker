import { useState } from 'react';

export interface MealPlanPromptResponse {
  prompt: string;
  summary: {
    totalIngredients: number;
    totalMeals: number;
    ingredients: Array<{
      name: string;
      macros: string;
      unit: string;
    }>;
    meals: Array<{
      name: string;
      macros: string;
      ingredients: string;
      notes: string;
      instructions: string;
    }>;
  };
}

export interface UseMealPlanGeneratorReturn {
  generatePrompt: (userGoals?: string) => Promise<MealPlanPromptResponse | null>;
  isLoading: boolean;
  error: string | null;
  lastGeneratedPrompt: string | null;
  lastSummary: MealPlanPromptResponse['summary'] | null;
}

export function useMealPlanGenerator(): UseMealPlanGeneratorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<MealPlanPromptResponse['summary'] | null>(null);

  const generatePrompt = async (userGoals?: string): Promise<MealPlanPromptResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userGoals }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate meal plan prompt');
      }

      const data: MealPlanPromptResponse = await response.json();
      
      setLastGeneratedPrompt(data.prompt);
      setLastSummary(data.summary);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatePrompt,
    isLoading,
    error,
    lastGeneratedPrompt,
    lastSummary,
  };
} 