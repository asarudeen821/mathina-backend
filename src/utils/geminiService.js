import axios from 'axios';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  /**
   * General chat / Q&A with Gemini
   * @param {string} prompt - Full prompt
   * @returns {Promise<string>} Response text
   */
  async chat(prompt) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured');
    }
    try {
      const response = await axios.post(
        `${this.baseURL}/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data?.candidates?.[0]?.content?.parts?.[0]) {
        return response.data.candidates[0].content.parts[0].text;
      }
      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      if (error.response) throw new Error(`Gemini API Error: ${error.response.status}`);
      throw error;
    }
  }

  /**
   * Generate recipe based on user's order history and preferences
   * @param {string} products - List of products user has purchased
   * @param {string} dishType - Type of dish requested
   * @param {string} preferences - Dietary preferences
   * @returns {Promise<string>} Generated recipe
   */
  async generateRecipe(products, dishType = '', preferences = '') {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildRecipePrompt(products, dishType, preferences);

    try {
      const response = await axios.post(
        `${this.baseURL}/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0]
      ) {
        return response.data.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      if (error.response) {
        console.error('Gemini API Error:', error.response.data);
        throw new Error(`Gemini API Error: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * Get nutritional information for a dish
   * @param {string} dishName - Name of the dish
   * @returns {Promise<object>} Nutritional information
   */
  async getNutritionInfo(dishName) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Provide detailed nutritional information for ${dishName}. 
    Include: calories, protein, carbohydrates, fat, fiber, vitamins, and minerals.
    Format as JSON with these keys: calories, protein, carbs, fat, fiber, vitamins, minerals`;

    try {
      const response = await axios.post(
        `${this.baseURL}/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]) {
        return this.parseNutritionResponse(
          response.data.candidates[0].content.parts[0].text
        );
      }

      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('Gemini nutrition error:', error);
      return null;
    }
  }

  /**
   * Generate shopping list based on recipe
   * @param {string} recipe - Recipe text
   * @returns {Promise<string[]>} List of ingredients
   */
  async generateShoppingList(recipe) {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Extract all ingredients from this recipe and return as a simple list:
    ${recipe}
    
    Return only the ingredient names, one per line, no quantities.`;

    try {
      const response = await axios.post(
        `${this.baseURL}/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]) {
        return response.data.candidates[0].content.parts[0].text
          .split('\n')
          .filter((line) => line.trim() !== '');
      }

      return [];
    } catch (error) {
      console.error('Gemini shopping list error:', error);
      return [];
    }
  }

  /**
   * Build recipe prompt for Gemini
   * @private
   */
  buildRecipePrompt(products, dishType, preferences) {
    let prompt = `You are a professional chef specializing in chicken dishes, particularly South Indian and Chennai-style cuisine. 
    
The user has purchased these chicken products: ${products}.

Based on these ingredients, suggest a delicious recipe`;

    if (dishType) {
      prompt += ` for ${dishType}`;
    }

    prompt += `.\n\n`;

    if (preferences) {
      prompt += `Dietary Preferences: ${preferences}\n\n`;
    }

    prompt += `Please provide a complete recipe with the following structure:

# [Recipe Name - make it creative and appealing]

## Description
(2-3 sentences describing the dish and its origins)

## Preparation Time
(X minutes)

## Cooking Time
(X minutes)

## Servings
(X people)

## Ingredients
- List all ingredients with exact measurements
- Include spices and seasonings
- Mention any marinade requirements

## Step-by-step Instructions
1. First step
2. Second step
(Continue with detailed, numbered steps)

## Chef's Tips
- Tip 1
- Tip 2
- Tip 3

## Nutritional Information (per serving)
- Calories: X kcal
- Protein: Xg
- Carbohydrates: Xg
- Fat: Xg

Include Tamil/Chennai-style cooking suggestions where appropriate. Make the recipe easy to follow for home cooks.`;

    return prompt;
  }

  /**
   * Parse nutrition response from Gemini
   * @private
   */
  parseNutritionResponse(text) {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse key-value pairs
      const nutrition = {};
      const lines = text.split('\n');
      lines.forEach((line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          nutrition[key.trim().toLowerCase()] = value.trim();
        }
      });
      return nutrition;
    } catch (error) {
      console.error('Error parsing nutrition response:', error);
      return { raw: text };
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return false;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: 'Hello',
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return !!response.data?.candidates?.[0];
    } catch (error) {
      console.error('Gemini connection test failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const geminiService = new GeminiService();
export default geminiService;
