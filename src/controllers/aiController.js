import geminiService from '../utils/geminiService.js';
import Order from '../models/Order.js';

// @desc    Generate AI recipe based on order history
// @route   POST /api/ai/recipe
// @access  Private
export const generateRecipe = async (req, res) => {
  try {
    const { dishType, preferences } = req.body;

    // Get user's order history
    const orders = await Order.find({
      user: req.user._id,
      orderStatus: 'delivered',
    }).populate('items.product', 'name category');

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order history found. Place some orders first!',
      });
    }

    // Extract purchased products
    const purchasedProducts = new Set();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product) {
          purchasedProducts.add(item.product.name);
        }
      });
    });

    const productsList = Array.from(purchasedProducts).join(', ');

    // Call Gemini Service
    const recipe = await geminiService.generateRecipe(
      productsList,
      dishType,
      preferences
    );

    res.status(200).json({
      success: true,
      data: {
        recipe,
        basedOn: productsList,
      },
    });
  } catch (error) {
    console.error('Generate recipe error:', error);

    // Fallback to mock recipe if API fails
    const fallbackRecipe = generateFallbackRecipe();

    res.status(200).json({
      success: true,
      data: {
        recipe: fallbackRecipe,
        note: 'AI service temporarily unavailable. Showing sample recipe.',
      },
    });
  }
};

// @desc    Get personalized meal suggestions
// @route   GET /api/ai/suggestions
// @access  Private
export const getMealSuggestions = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      orderStatus: 'delivered',
    }).populate('items.product', 'name category nutritionInfo');

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order history found',
      });
    }

    // Analyze purchase patterns
    const categoryCount = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product?.category) {
          categoryCount[item.product.category] =
            (categoryCount[item.product.category] || 0) + 1;
        }
      });
    });

    // Generate suggestions based on patterns
    const suggestions = generateSuggestions(categoryCount);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Get meal suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get suggestions',
    });
  }
};

// Generate suggestions based on purchase patterns
function generateSuggestions(categoryCount) {
  const suggestions = [];

  // Find most purchased category
  const topCategory = Object.entries(categoryCount).sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (topCategory) {
    suggestions.push({
      type: 'favorite',
      message: `You love our ${topCategory[0]}! Try this new recipe...`,
      recipe: getRecipeForCategory(topCategory[0]),
    });
  }

  // Health suggestion
  suggestions.push({
    type: 'health',
    message: 'High-protein, low-fat option for your fitness goals',
    recipe: {
      name: 'Grilled Chicken Breast',
      time: '25 mins',
      calories: '180 kcal',
    },
  });

  // Festival suggestion (Chennai-specific)
  const currentMonth = new Date().getMonth();
  if (currentMonth === 0 || currentMonth === 3) {
    // January or April (Pongal season)
    suggestions.push({
      type: 'festival',
      message: 'Pongal Special: Traditional Chicken Chettinad',
      recipe: {
        name: 'Chicken Chettinad',
        time: '45 mins',
        special: 'Authentic Tamil Nadu recipe',
      },
    });
  }

  return suggestions;
}

// Get recipe for category
function getRecipeForCategory(category) {
  const recipes = {
    'chicken-cuts': {
      name: 'Chicken Biryani',
      time: '60 mins',
      difficulty: 'Medium',
    },
    eggs: {
      name: 'Chicken Egg Curry',
      time: '35 mins',
      difficulty: 'Easy',
    },
    marinades: {
      name: 'Tandoori Chicken',
      time: '40 mins',
      difficulty: 'Medium',
    },
  };

  return (
    recipes[category] || {
      name: 'Chicken Curry',
      time: '40 mins',
      difficulty: 'Easy',
    }
  );
}

// Fallback recipe generator
function generateFallbackRecipe() {
  return `
# Classic Chicken Biryani

## Description
A fragrant and flavorful Chennai-style chicken biryani perfect for family gatherings.

## Preparation Time
30 minutes

## Cooking Time
45 minutes

## Servings
4-5 people

## Ingredients
- 500g Chicken (curry cut)
- 2 cups Basmati Rice
- 1 cup Yogurt
- 2 Onions (sliced)
- 2 Tomatoes (chopped)
- 2 tbsp Ginger-Garlic paste
- 4 Green chilies
- Fresh Mint & Coriander leaves
- Biryani Masala - 2 tbsp
- Turmeric, Red Chili powder
- Salt to taste
- Ghee & Oil

## Instructions
1. Marinate chicken with yogurt, ginger-garlic paste, spices for 30 mins
2. Parboil rice with whole spices until 70% cooked
3. Cook marinated chicken until tender
4. Layer rice over chicken
5. Garnish with fried onions, mint, coriander
6. Seal with dough and cook on dum for 20 mins
7. Serve hot with raita!

## Chef's Tips
- Use good quality basmati rice
- Don't overcook the rice while parboiling
- Low flame dum cooking is crucial for authentic taste

## Nutritional Info (per serving)
- Calories: ~450 kcal
- Protein: 28g
- Carbs: 52g
- Fat: 14g

Enjoy your homemade CluckFresh Biryani! 🍗
  `;
}
