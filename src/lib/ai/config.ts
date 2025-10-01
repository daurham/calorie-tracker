// AI Configuration
export const AI_CONFIG = {
  // API Endpoints
  BACKEND_ENDPOINT: '/api/analyze-food',
  
  // Request Settings
  MAX_TOKENS: 500,
  TEMPERATURE: 0.3,
  
  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: 15,
  
  // Fallback Settings
  USE_MOCK_DATA: import.meta.env.MODE === 'development',
};

// Food Analysis Prompt Template
export const FOOD_ANALYSIS_PROMPT = `You are a nutrition expert. Analyze the following food description and provide accurate nutritional information.

Food Description: "{description}"

Please respond with a JSON object containing:
- name: The most likely food name
- calories: Estimated calories per serving
- protein: Protein in grams per serving
- carbs: Carbohydrates in grams per serving  
- fat: Fat in grams per serving
- confidence: Your confidence level (0-1)
- description: Brief explanation of your analysis

Be as accurate as possible. If the description is unclear, make reasonable assumptions and note them in the description field.`;
