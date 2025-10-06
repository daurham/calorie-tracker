import { ModHandler, ModInput, ModCalculation, ModMeal } from '@/types/mods';

export const aiFoodRecommendationMod: ModHandler = {
  id: 'ai-food-recommendation',
  name: 'AI Food Recommendation',
  description: 'Get personalized meal recommendations based on your cravings, remaining macros, and available ingredients.',
  inputs: [
    {
      type: 'radio',
      label: 'Craving Types',
      key: 'cravingTypes',
      required: true,
      options: [
        { value: 'salty', label: 'Salty' },
        { value: 'sweet', label: 'Sweet' },
        { value: 'spicy', label: 'Spicy' },
        { value: 'savory', label: 'Savory' },
        { value: 'creamy', label: 'Creamy' },
        { value: 'crunchy', label: 'Crunchy' },
        { value: 'fresh', label: 'Fresh' },
        { value: 'comfort', label: 'Comfort Food' }
      ],
      defaultValue: []
    },
    {
      type: 'select',
      label: 'Data Source',
      key: 'dataSource',
      required: true,
      options: [
        { value: 'any', label: 'Any ingredients (AI creativity)' },
        { value: 'staples', label: 'Common staple ingredients' },
        { value: 'all', label: 'All my ingredients & meals' }
      ],
      defaultValue: 'any'
    },
    {
      type: 'select',
      label: 'Time of Day',
      key: 'timeOfDay',
      required: true,
      options: [
        { value: 'morning', label: 'Morning' },
        { value: 'midday', label: 'Midday' },
        { value: 'evening', label: 'Evening' }
      ],
      defaultValue: 'midday'
    },
    {
      type: 'text',
      label: 'Additional Preferences',
      key: 'preferences',
      required: false,
      placeholder: 'e.g., vegetarian, quick to make, high protein...'
    }
  ],

  calculate: (inputs: Record<string, any>): ModCalculation => {
    // This will be handled by the modal component since it requires async API calls
    // The modal will handle the AI API call and return the selected recommendation
    throw new Error('AI Food Recommendation requires modal interaction');
  },

  generateMeal: (inputs: Record<string, any>): ModMeal => {
    // This will be called by the modal after the user selects a recommendation
    const selectedRecommendation = inputs.selectedRecommendation;
    
    if (!selectedRecommendation) {
      throw new Error('No recommendation selected');
    }

    return {
      id: `ai-recommendation-${Date.now()}`,
      name: selectedRecommendation.name,
      meal_type: 'mod',
      calories: selectedRecommendation.calories,
      protein: selectedRecommendation.protein,
      carbs: selectedRecommendation.carbs,
      fat: selectedRecommendation.fat,
      notes: selectedRecommendation.description,
      instructions: selectedRecommendation.instructions?.join('\n') || `AI Recommendation: ${selectedRecommendation.reasoning}`,
      ingredients: selectedRecommendation.ingredients?.map((ingredient, index) => ({
        id: `ingredient-${index}`,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        calories: 0, // Will be calculated if needed
        protein: 0,
        carbs: 0,
        fat: 0
      })) || [],
      modId: 'ai-food-recommendation',
      modData: {
        cravingTypes: inputs.cravingTypes,
        dataSource: inputs.dataSource,
        timeOfDay: inputs.timeOfDay,
        preferences: inputs.preferences,
        confidence: selectedRecommendation.confidence,
        originalRecommendations: inputs.allRecommendations || []
      }
    };
  }
};
