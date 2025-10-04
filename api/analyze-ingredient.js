export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, servingType = 'serving' } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const apiKey = process.env.AI_API_KEY;
    
    if (!apiKey) {
      console.log('No API key found, using mock data');
      // Mock data for development
      const mockData = {
        name: "Bell Pepper (Red)",
        calories: 31,
        protein: 1.0,
        carbs: 7.3,
        fat: 0.3,
        unit: "1 medium (119g)",
        confidence: 0.85,
        description: "Based on your description, this appears to be a red bell pepper. Nutritional values are per medium-sized pepper."
      };
      
      return res.status(200).json(mockData);
    }

    console.log('Analyzing ingredient description:', description);

    const prompt = `Analyze this ingredient: "${description}" (${servingType} serving)

Return JSON only:
{
  "name": "Specific ingredient name",
  "calories": 0,
  "protein": 0.0,
  "carbs": 0.0,
  "fat": 0.0,
  "unit": "descriptive unit",
  "confidence": 0.8,
  "description": "brief explanation"
}

Guidelines:
- ${servingType === 'serving' ? 'Typical serving size' : 'Whole item'} values
- Round calories to whole numbers, macros to 1 decimal
- Be specific with ingredient names
- Include descriptive units (e.g., "1 medium (119g)")`;

    const response = await fetch(
      'https://ai.daurham.com/api/nutrition',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.AI_API_KEY,
        },
        body: JSON.stringify({
          query: prompt
        }),
      }
    );

    console.log('AI API response:', response);

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
      console.error('No content found in response. Full response structure:', JSON.stringify(data, null, 2));
      
      // Provide a fallback response
      const fallbackResult = {
        name: description || 'Unknown Ingredient',
        calories: 0,
        protein: 0.0,
        carbs: 0.0,
        fat: 0.0,
        unit: '100g',
        confidence: 0.1,
        description: 'Unable to analyze - please enter nutritional data manually'
      };
      
      const formattedResult = {
        name: fallbackResult.name,
        calories: Math.round(fallbackResult.calories),
        protein: Math.round(fallbackResult.protein * 10) / 10,
        carbs: Math.round(fallbackResult.carbs * 10) / 10,
        fat: Math.round(fallbackResult.fat * 10) / 10,
        unit: fallbackResult.unit,
        confidence: Math.min(Math.max(fallbackResult.confidence, 0), 1),
        description: fallbackResult.description
      };
      
      console.log('Returning fallback result:', formattedResult);
      return res.status(200).json(formattedResult);
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

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(cleanedContent);
      console.log('Parsed result:', result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', cleanedContent);
      
      // Try to extract partial JSON if parsing fails
      console.log('Attempting to extract partial JSON from response...');
      try {
        // Try to find the last complete JSON object
        const lastBraceIndex = cleanedContent.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          const partialJson = cleanedContent.substring(0, lastBraceIndex + 1);
          result = JSON.parse(partialJson);
          console.log('Successfully parsed partial JSON:', result);
        } else {
          throw new Error('No complete JSON object found in response');
        }
      } catch (partialParseError) {
        console.error('Failed to parse partial JSON:', partialParseError);
        throw new Error('Failed to parse JSON response from AI API');
      }
    }
    
    // Validate and format the response
    const formattedResult = {
      name: result.name || 'Unknown Ingredient',
      calories: Math.round(result.calories || 0),
      protein: Math.round((result.protein || 0) * 10) / 10,
      carbs: Math.round((result.carbs || 0) * 10) / 10,
      fat: Math.round((result.fat || 0) * 10) / 10,
      unit: result.unit || '100g',
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
      description: result.description || 'AI analysis complete'
    };

    console.log('Returning formatted result:', formattedResult);
    res.status(200).json(formattedResult);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to analyze ingredient description', details: error.message });
  }
}
