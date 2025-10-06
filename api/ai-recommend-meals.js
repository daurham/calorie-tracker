const AI_API_URL = 'https://ai.daurham.com/api/nutrition';
const AI_API_KEY = process.env.AI_API_KEY;
const NUMBER_OF_RECOMMENDATIONS = 1;

// Function to clean fractional quantities in JSON
const cleanFractionalQuantities = (content) => {
  // Replace common fractions with decimal equivalents
  let cleaned = content.replace(/"quantity":\s*1\/2\b/g, '"quantity": 0.5');
  cleaned = cleaned.replace(/"quantity":\s*1\/4\b/g, '"quantity": 0.25');
  cleaned = cleaned.replace(/"quantity":\s*1\/3\b/g, '"quantity": 0.33');
  cleaned = cleaned.replace(/"quantity":\s*2\/3\b/g, '"quantity": 0.67');
  cleaned = cleaned.replace(/"quantity":\s*3\/4\b/g, '"quantity": 0.75');
  
  return cleaned;
};

export default async function handler(req, res) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const {
      cravingTypes,
      dataSource,
      preferences,
      timeOfDay,
      currentMacros,
      remainingMacros,
      availableIngredients,
      availableMeals
    } = body;

    // Validate required fields
    if (!cravingTypes || cravingTypes.length === 0) {
      return res.status(400).json({ error: 'At least one craving type is required' });
    }

    // Build the AI prompt
    let prompt = `You are a nutrition expert and meal recommendation specialist. Generate ${NUMBER_OF_RECOMMENDATIONS} personalized meal recommendations based on the following criteria:

User Preferences:
- Craving types: ${cravingTypes.join(', ')}
- Time of day: ${timeOfDay}
- Additional preferences: ${preferences || 'None specified'}

Current Nutrition Status:
- Current macros: ${currentMacros.calories} calories, ${currentMacros.protein}g protein, ${currentMacros.carbs}g carbs, ${currentMacros.fat}g fat
- Remaining macros needed: ${remainingMacros.calories} calories, ${remainingMacros.protein}g protein, ${remainingMacros.carbs}g carbs, ${remainingMacros.fat}g fat

Data Source: ${dataSource}`;

    // Add ingredient/meal data if available
    if (dataSource === 'all' && availableIngredients.length > 0) {
      prompt += `\n\nAvailable Ingredients (${availableIngredients.length} total):`;
      // Only send top 10 most relevant ingredients to reduce payload
      availableIngredients.slice(0, 10).forEach(ingredient => {
        prompt += `\n- ${ingredient.name}: ${ingredient.calories} cal, ${ingredient.protein}g protein, ${ingredient.carbs}g carbs, ${ingredient.fat}g fat`;
      });
      if (availableIngredients.length > 10) {
        prompt += `\n... and ${availableIngredients.length - 10} more ingredients available`;
      }
    }

    if (dataSource === 'all' && availableMeals.length > 0) {
      prompt += `\n\nAvailable Meals (${availableMeals.length} total):`;
      availableMeals.slice(0, 10).forEach(meal => {
        prompt += `\n- ${meal.name}: ${meal.calories} cal, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat`;
      });
      if (availableMeals.length > 10) {
        prompt += `\n... and ${availableMeals.length - 10} more meals`;
      }
    }

    prompt += `\n\nIMPORTANT GUIDELINES:
1. For ${timeOfDay} meals, consider appropriate portion sizes:
   - Morning: Moderate portions (don't fill all remaining macros)
   - Midday: Reasonable portions (leave room for dinner)
   - Evening: Can be larger portions (can fill more remaining macros)

2. Each recommendation should include:
   - A creative, appealing meal name
   - Detailed description of the meal
   - Accurate nutritional breakdown
   - Confidence score (0-1) based on how well it matches criteria
   - Reasoning for why this meal fits their needs
   - List of ingredients with quantities and units
   - Simple cooking instructions (max 4 steps, keep it brief)

3. Consider the craving types in your recommendations
4. If using available ingredients/meals, you can reference them but don't feel constrained
5. Make recommendations diverse and appealing
6. Consider the time of day for appropriate meal types

Respond with ONLY a valid JSON array of ${NUMBER_OF_RECOMMENDATIONS} meal objects in this exact format:
[
  {
    "name": "Meal Name",
    "description": "Detailed description of the meal",
    "calories": 500,
    "protein": 30,
    "carbs": 45,
    "fat": 20,
    "confidence": 0.85,
    "reasoning": "Why this meal fits their needs and cravings",
    "ingredients": [
      {
        "name": "Ingredient Name",
        "quantity": 2,
        "unit": "cups"
      }
    ],
    "instructions": [
      "Prepare ingredients as needed",
      "Cook according to standard methods",
      "Season and serve"
    ]
  }
]`;

    console.log('AI Recommendation request:', {
      cravingTypes,
      dataSource,
      timeOfDay,
      preferences: preferences ? 'Yes' : 'No',
      ingredientsCount: availableIngredients?.length || 0,
      mealsCount: availableMeals?.length || 0
    });

    // Check if we have the API key
    if (!AI_API_KEY) {
      console.log('No AI_API_KEY found, returning mock data');
      // Return mock data if no API key
      const mockRecommendations = [
        {
          name: "Balanced Protein Bowl",
          description: "A nutritious meal with lean protein, complex carbs, and healthy fats",
          calories: 400,
          protein: 30,
          carbs: 35,
          fat: 15,
          confidence: 0.6,
          reasoning: "A balanced meal that provides good nutrition for your needs"
        }
      ];
      return res.status(200).json({ recommendations: mockRecommendations });
    }

    // Call AI API
      const aiResponse = await fetch(
        `${AI_API_URL}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': AI_API_KEY,
          },
          body: JSON.stringify({
            query: prompt
          }),
          timeout: 90000 // 90 second timeout (within Cloudflare limits)
        }
      );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      
      // Handle timeout errors specifically
      if (aiResponse.status === 524 || errorText.includes('timeout')) {
        console.log('AI API timeout after 90 seconds, returning fallback recommendations');
        const fallbackRecommendations = [
          {
            name: "Quick Protein Bowl",
            description: "A simple and nutritious meal with grilled chicken, quinoa, and mixed vegetables.",
            calories: 450,
            protein: 35,
            carbs: 40,
            fat: 15,
            confidence: 0.7,
            reasoning: "Fallback recommendation due to AI service timeout",
            ingredients: [
              { name: "Chicken Breast", quantity: 1, unit: "piece" },
              { name: "Quinoa", quantity: 0.5, unit: "cup" },
              { name: "Mixed Vegetables", quantity: 1, unit: "cup" }
            ],
            instructions: [
              "Cook quinoa and chicken",
              "Steam vegetables",
              "Combine and serve"
            ]
          }
        ];
        return res.status(200).json({ 
          recommendations: fallbackRecommendations,
          fallback: true,
          error: "AI service timeout after 90 seconds - showing fallback recommendations"
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    console.log('AI API response data:', data);
    
    // Extract content from the response structure
    let content = data.result || data.content || data.response || data.text || data;
    
    console.log('Extracted content type:', typeof content);
    console.log('Extracted content:', content);
    
    // If content is an object, try to stringify it
    if (typeof content === 'object' && content !== null) {
      content = JSON.stringify(content);
      console.log('Stringified content:', content);
    }

    if (!content) {
      throw new Error('No content received from AI API');
    }

    // Parse the JSON response
    let recommendations;
    try {
      // Clean the response to ensure valid JSON
      const cleanedContent = cleanFractionalQuantities(content.trim());
      
      console.log('Attempting to parse content:', cleanedContent.substring(0, 200) + '...');
      
      // Try to parse directly first
      if (cleanedContent.startsWith('[') && cleanedContent.endsWith(']')) {
        console.log('Parsing as direct array');
        recommendations = JSON.parse(cleanedContent);
      } else {
        // Look for JSON array in the content
        const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          console.log('Found JSON array in content');
          recommendations = JSON.parse(jsonMatch[0]);
        } else {
          // Try to parse the entire content as JSON
          try {
            console.log('Attempting to parse entire content as JSON');
            const parsed = JSON.parse(cleanedContent);
            console.log('Parsed result:', parsed);
            
            if (Array.isArray(parsed)) {
              recommendations = parsed;
            } else if (parsed && Array.isArray(parsed.recommendations)) {
              recommendations = parsed.recommendations;
            } else if (parsed && Array.isArray(parsed.data)) {
              recommendations = parsed.data;
            } else {
              throw new Error('No valid array found in parsed content');
            }
          } catch (directParseError) {
            console.error('Direct parse error:', directParseError);
            throw new Error('No JSON array found in response');
          }
        }
      }
      
      console.log('Successfully parsed recommendations:', recommendations);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      
      // Try one more fallback - check if the original data object has recommendations
      try {
        if (data && Array.isArray(data.recommendations)) {
          console.log('Found recommendations in data object');
          recommendations = data.recommendations;
        } else if (data && Array.isArray(data.data)) {
          console.log('Found data array in data object');
          recommendations = data.data;
        } else {
          throw new Error('No valid recommendations found in any format');
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        
        // Final fallback: return mock recommendations
        const fallbackRecommendations = [
          {
            name: "Grilled Chicken with Quinoa",
            description: "A balanced meal with grilled chicken breast, quinoa, and steamed vegetables",
            calories: 400,
            protein: 35,
            carbs: 30,
            fat: 12,
            confidence: 0.7,
            reasoning: "High protein meal that fits your craving for savory foods and provides good nutrition"
          }
        ];
        
        return res.status(200).json({
          recommendations: fallbackRecommendations,
          fallback: true,
          error: parseError.message
        });
      }
    }

    // Validate recommendations
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error('Invalid recommendations format');
    }

    // Ensure each recommendation has required fields
    const validatedRecommendations = recommendations.map((rec, index) => ({
      name: rec.name || `Meal ${index + 1}`,
      description: rec.description || 'A delicious meal recommendation',
      calories: Math.max(0, rec.calories || 300),
      protein: Math.max(0, rec.protein || 20),
      carbs: Math.max(0, rec.carbs || 30),
      fat: Math.max(0, rec.fat || 10),
      confidence: Math.max(0, Math.min(1, rec.confidence || 0.7)),
      reasoning: rec.reasoning || 'This meal fits your preferences and nutritional needs',
      ingredients: rec.ingredients || [],
      instructions: rec.instructions || []
    }));

    console.log('Validated recommendations:', validatedRecommendations);

    return res.status(200).json({
      recommendations: validatedRecommendations
    });

  } catch (error) {
    console.error('Error in AI recommendation API:', error);
    
    // Return fallback recommendations
    const fallbackRecommendations = [
      {
        name: "Balanced Protein Bowl",
        description: "A nutritious meal with lean protein, complex carbs, and healthy fats",
        calories: 400,
        protein: 30,
        carbs: 35,
        fat: 15,
        confidence: 0.6,
        reasoning: "A balanced meal that provides good nutrition for your needs"
      }
    ];

    return res.status(200).json({
      recommendations: fallbackRecommendations,
      fallback: true,
      error: error.message
    });
  }
}
