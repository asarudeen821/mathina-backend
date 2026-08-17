/**
 * Recipe Engine - Rule-Based Recipe Recommendation
 * Hybrid AI: Rules first, AI enhancement only when needed
 */

import { recipes, getRecipesByType, getRecipesByCut, searchRecipes } from '../services/recipes.js';

/**
 * Detect recipe intent from user message
 * @param {string} message - User message
 * @returns {Object} Intent detection result
 */
export const detectRecipeIntent = (message) => {
  if (!message) return { detected: false };

  const text = message.toLowerCase();

  // Recipe type keywords
  const recipeTypes = {
    curry: ['curry', 'குழம்பு', 'kuzhambu', 'gravy'],
    fry: ['fry', 'வறுவல்', 'varuval', 'fried', 'crispy'],
    grill: ['grill', 'கிரில்', 'grilled', 'barbecue', 'bbq', 'roast'],
    biryani: ['biryani', 'பிரியாணி', 'biriyani', 'rice'],
    tandoori: ['tandoori', 'தந்தூரி', 'tandoor', 'oven'],
    kebab: ['kebab', 'கபாப்', 'kabab', 'tikka'],
    soup: ['soup', 'சூப்', 'sup', 'broth'],
    '65': ['65', 'chicken 65', 'chicken65'],
    'shawarma': ['shawarma', 'awarema'],
    'lollipop': ['lollipop'],
    'dragon': ['dragon chicken', 'dragon cut'],
    'tikka': ['tikka', 'malai tikka'],
    'wings': ['wings', 'chicken wings'],
  };

  // Check for recipe type matches
  for (const [type, keywords] of Object.entries(recipeTypes)) {
    if (keywords.some((kw) => text.includes(kw))) {
      // For '65', 'shawarma', 'lollipop', 'dragon', 'tikka', 'wings' — search by name
      const nameSearchTypes = ['65', 'shawarma', 'lollipop', 'dragon', 'tikka', 'wings'];
      let matchingRecipes;
      if (nameSearchTypes.includes(type)) {
        matchingRecipes = searchRecipes(type === '65' ? 'chicken 65' : type);
      } else {
        matchingRecipes = getRecipesByType(type);
      }
      if (matchingRecipes.length > 0) {
        return {
          detected: true,
          intent: 'recipe',
          recipeType: type,
          recipes: matchingRecipes,
          confidence: 'high',
        };
      }
    }
  }

  // Check for cut-based recommendations
  const cuts = {
    'curry cut': ['curry cut', 'curry-cut', 'கறி வெட்டு'],
    'fry cut': ['fry cut', 'fry-cut'],
    boneless: ['boneless', 'எலும்பு இல்லாத'],
    'breast': ['breast', 'மார்பக'],
    'leg piece': ['leg', 'leg piece', 'கால்'],
    'thigh': ['thigh', 'தொடை'],
    whole: ['whole', 'முழு'],
  };

  for (const [cut, keywords] of Object.entries(cuts)) {
    if (keywords.some((kw) => text.includes(kw))) {
      const matchingRecipes = getRecipesByCut(cut);
      if (matchingRecipes.length > 0) {
        return {
          detected: true,
          intent: 'recipe',
          cut: cut,
          recipes: matchingRecipes,
          confidence: 'medium',
        };
      }
    }
  }

  // Check for general recipe queries
  const recipeKeywords = [
    'recipe', 'ரெசிபி', 'vidhai', 'way to make', 'how to cook',
    'prepare', 'cook', 'சமைக்க', 'make', 'make dish',
  ];

  if (recipeKeywords.some((kw) => text.includes(kw))) {
    return {
      detected: true,
      intent: 'recipe',
      recipes: recipes.slice(0, 3), // Return top 3 recipes
      confidence: 'low',
    };
  }

  return { detected: false };
};

/**
 * Format recipe response for user
 * @param {Object} recipe - Recipe object
 * @param {string} language - User language preference
 * @returns {string} Formatted response
 */
export const formatRecipeResponse = (recipe, language = 'english') => {
  if (!recipe) return '';

  const isTamil = language === 'tamil';

  let response = isTamil
    ? `🍗 *${recipe.nameTamil || recipe.name}*\n\n`
    : `🍗 *${recipe.name}*\n\n`;

  response += isTamil
    ? `⏱️ தயார் நேரம்: ${recipe.prepTime} + ${recipe.cookingTime}\n`
    : `⏱️ Time: ${recipe.prepTime} prep + ${recipe.cookingTime} cook\n`;

  response += isTamil
    ? `🍽️ பரிமாறல்: ${recipe.servings}\n`
    : `🍽️ Servings: ${recipe.servings}\n`;

  response += isTamil
    ? `📊 கடினம்: ${recipe.difficulty}\n\n`
    : `📊 Difficulty: ${recipe.difficulty}\n\n`;

  if (isTamil) {
    response += `*தேவையானவை:*\n`;
    recipe.ingredients.forEach((ing, i) => {
      response += `${i + 1}. ${ing}\n`;
    });
    response += `\n*செய்முறை:*\n`;
    recipe.instructions.forEach((step, i) => {
      response += `${i + 1}. ${step}\n`;
    });
    response += `\n💡 *குறிப்பு:* ${recipe.tips}`;
  } else {
    response += `*Ingredients:*\n`;
    recipe.ingredients.forEach((ing, i) => {
      response += `${i + 1}. ${ing}\n`;
    });
    response += `\n*Instructions:*\n`;
    recipe.instructions.forEach((step, i) => {
      response += `${i + 1}. ${step}\n`;
    });
    response += `\n💡 *Chef's Tip:* ${recipe.tips}`;
  }

  return response;
};

/**
 * Get recipe recommendation based on user message
 * @param {string} message - User message
 * @param {string} language - Language preference
 * @returns {Object} Recipe recommendation result
 */
export const getRecipeRecommendation = (message, language = 'english') => {
  const intent = detectRecipeIntent(message);

  if (!intent.detected) {
    return {
      found: false,
      response: null,
    };
  }

  // If multiple recipes, return summary
  if (intent.recipes && intent.recipes.length > 1) {
    const isTamil = language === 'tamil';
    let response = isTamil
      ? `🍗 ${intent.recipeType ? `${intent.recipeType.toUpperCase()} ` : ''}ரெசிபிகள் இங்கே:\n\n`
      : `🍗 Here are some ${intent.recipeType ? `${intent.recipeType.toUpperCase()} ` : ''}recipes:\n\n`;

    intent.recipes.slice(0, 3).forEach((recipe, index) => {
      response += `${index + 1}. *${isTamil ? recipe.nameTamil || recipe.name : recipe.name}*\n`;
      response += isTamil
        ? `   - நேரம்: ${recipe.cookingTime}, கடினம்: ${recipe.difficulty}\n`
        : `   - Time: ${recipe.cookingTime}, Difficulty: ${recipe.difficulty}\n`;
    });

    response += isTamil
      ? `\n💡 விரிவான ரெசிபி வேண்டுமா? குறிப்பிட்ட உணவு பெயரைச் சொல்லுங்கள்!`
      : `\n💡 Want detailed recipe? Ask for a specific dish!`;

    return {
      found: true,
      response,
      recipes: intent.recipes,
      type: 'multiple',
    };
  }

  // Single recipe - return full details
  const recipe = intent.recipes[0];
  const formattedResponse = formatRecipeResponse(recipe, language);

  return {
    found: true,
    response: formattedResponse,
    recipe: recipe,
    type: 'single',
  };
};

/**
 * Get quick recipe suggestion (for chat prompts)
 * @param {string} context - Context (e.g., 'quick', 'healthy', 'party')
 * @returns {Object} Suggested recipe
 */
export const getQuickRecipeSuggestion = (context = 'quick') => {
  const contextFilters = {
    quick: ['fry', 'soup'],
    healthy: ['grill', 'soup'],
    party: ['biryani', 'tandoori', 'kebab'],
    comfort: ['curry', 'soup'],
    special: ['biryani', 'tandoori'],
  };

  const preferredTypes = contextFilters[context] || ['fry'];
  const matchingRecipes = recipes.filter((r) => preferredTypes.includes(r.type));

  if (matchingRecipes.length > 0) {
    const randomRecipe = matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)];
    return {
      recipe: randomRecipe,
      message: `Try making ${randomRecipe.name}! Perfect ${context} option. 🍗`,
    };
  }

  return {
    recipe: recipes[0],
    message: 'Try our classic Chicken Curry! 🍗',
  };
};

export default {
  detectRecipeIntent,
  formatRecipeResponse,
  getRecipeRecommendation,
  getQuickRecipeSuggestion,
};
