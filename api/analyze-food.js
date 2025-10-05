export default async function handler(req, res) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Check if we have the API key
    if (!process.env.AI_API_KEY) {
      console.log('No AI_API_KEY found, returning mock data');
      // Return mock data if no API key
      const mockResult = {
        name: "Grilled Chicken Breast",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        confidence: 0.85,
        description: "Mock analysis: Based on your description, this appears to be a grilled chicken breast."
      };
      return res.status(200).json(mockResult);
    }

    const response = await fetch(
      'https://ai.daurham.com/api/nutrition',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.AI_API_KEY,
        },
        body: JSON.stringify({
          query: `You are a nutrition expert. Analyze the following food description and provide accurate nutritional information.

Food Description: "${description}"

IMPORTANT: Respond with ONLY a valid JSON object. Do not include any units (g, mg, etc.) in the numeric values. Use this exact format:

{
  "name": "Food Name",
  "calories": 300,
  "protein": 25,
  "carbs": 15,
  "fat": 12,
  "confidence": 0.8,
  "description": "Your analysis explanation"
}

Requirements:
- name: The most likely food name (string)
- calories: Estimated calories per serving (number only, no units)
- protein: Protein in grams per serving (number only, no units)
- carbs: Carbohydrates in grams per serving (number only, no units)
- fat: Fat in grams per serving (number only, no units)
- confidence: Your confidence level 0-1 (number)
- description: Brief explanation of your analysis (string)

Be as accurate as possible. If the description is unclear, make reasonable assumptions and note them in the description field.`
        }),
      }
    );


    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AI API response data:', data);
    
    // The new API should return the content directly in the response
    const content = data.result || data.content || data.response || data.text || data;
    
    if (!content) {
      throw new Error('No response from AI API');
    }

    console.log('Raw content from AI API:', content);

    // Clean the content - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('Cleaned content:', cleanedContent);

    // Clean nutritional values that might have units (e.g., "34g" -> 34)
    const cleanNutritionalValues = (content) => {
      // Remove units from nutritional values
      let cleaned = content.replace(/"(\w+)":\s*(\d+(?:\.\d+)?)g/g, '"$1": $2');
      
      // Also handle cases where units might be in quotes
      cleaned = cleaned.replace(/"(\w+)":\s*"(\d+(?:\.\d+)?)g"/g, '"$1": $2');
      
      // Handle any remaining unit suffixes
      cleaned = cleaned.replace(/"(\w+)":\s*(\d+(?:\.\d+)?)(g|mg|kg|oz|lb)\b/g, '"$1": $2');
      
      return cleaned;
    };

    const finalContent = cleanNutritionalValues(cleanedContent);
    console.log('Final cleaned content:', finalContent);

    // Parse the JSON response with better error handling
    let result;
    try {
      result = JSON.parse(finalContent);
      console.log('Parsed result:', result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse content:', finalContent);
      
      // Try to extract values using regex as fallback
      const extractValue = (content, key) => {
        const match = content.match(new RegExp(`"${key}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`));
        return match ? parseFloat(match[1]) : 0;
      };
      
      result = {
        name: (content.match(/"name"\s*:\s*"([^"]+)"/) || [null, 'Unknown Food'])[1],
        calories: extractValue(finalContent, 'calories'),
        protein: extractValue(finalContent, 'protein'),
        carbs: extractValue(finalContent, 'carbs'),
        fat: extractValue(finalContent, 'fat'),
        confidence: extractValue(finalContent, 'confidence') || 0.5,
        description: (content.match(/"description"\s*:\s*"([^"]+)"/) || [null, 'AI analysis complete'])[1]
      };
      
      console.log('Fallback parsed result:', result);
    }
    
    // Validate and format the response
    const formattedResult = {
      name: result.name || 'Unknown Food',
      calories: Math.round(result.calories || 0),
      protein: Math.round((result.protein || 0) * 10) / 10,
      carbs: Math.round((result.carbs || 0) * 10) / 10,
      fat: Math.round((result.fat || 0) * 10) / 10,
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
      description: result.description || 'AI analysis complete'
    };

    console.log('Returning formatted result:', formattedResult);
    res.status(200).json(formattedResult);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to analyze food description', details: error.message });
  }
}