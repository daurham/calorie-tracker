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

Please respond with a JSON object containing:
- name: The most likely food name
- calories: Estimated calories per serving
- protein: Protein in grams per serving
- carbs: Carbohydrates in grams per serving  
- fat: Fat in grams per serving
- confidence: Your confidence level (0-1)
- description: Brief explanation of your analysis

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

    // Parse the JSON response
    const result = JSON.parse(cleanedContent);
    console.log('Parsed result:', result);
    
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