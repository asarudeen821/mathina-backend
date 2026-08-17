import express from 'express';
import geminiService from '../utils/geminiService.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @desc    Test Gemini API connection
// @route   GET /api/utils/test-gemini
// @access  Private/Admin
router.get('/test-gemini', protect, admin, async (req, res) => {
  try {
    const isConnected = await geminiService.testConnection();

    if (isConnected) {
      res.status(200).json({
        success: true,
        message: 'Gemini API connection successful',
        data: {
          apiKeyConfigured: !!process.env.GEMINI_API_KEY,
          apiKeyStart: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
        },
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Gemini API connection failed',
        data: {
          apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Get nutrition info for a dish
// @route   POST /api/utils/nutrition
// @access  Public
router.post('/nutrition', async (req, res) => {
  try {
    const { dishName } = req.body;

    if (!dishName) {
      return res.status(400).json({
        success: false,
        message: 'Dish name is required',
      });
    }

    const nutrition = await geminiService.getNutritionInfo(dishName);

    res.status(200).json({
      success: true,
      data: nutrition,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Generate shopping list from recipe
// @route   POST /api/utils/shopping-list
// @access  Public
router.post('/shopping-list', async (req, res) => {
  try {
    const { recipe } = req.body;

    if (!recipe) {
      return res.status(400).json({
        success: false,
        message: 'Recipe is required',
      });
    }

    const shoppingList = await geminiService.generateShoppingList(recipe);

    res.status(200).json({
      success: true,
      data: shoppingList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
