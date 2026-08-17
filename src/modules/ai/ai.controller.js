/**
 * AI Chat Controller
 * Handles all AI chatbot interactions with hybrid AI system
 */

import { generateAIResponse, getRecommendations, getConfigStatus } from './ai.service.js';
import { getHistory, saveMessage, getSessionMetadata } from './ai.memory.js';
import { detectIntent, detectLanguage } from '../../utils/intent.js';
import { getRecipeRecommendation, getQuickRecipeSuggestion } from '../../services/recipe.engine.js';
import { getLatestOrder, getUserOrders } from '../../services/order.service.js';
import { formatOrderStatus } from '../../services/order.format.js';
import { addToCartByName, getCartSummary, clearCart } from '../../services/cart.service.js';
import { getUserPreferences, getReorderSuggestions } from '../../services/user.service.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';

/**
 * Chat with AI assistant
 * @route POST /api/ai/chat
 * @access Public (with optional auth for context)
 */
export const chatHandler = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?._id?.toString() || req.ip || 'guest';

    // Validate message
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Get user's conversation history
    const history = getHistory(userId);

    // Fetch products for context
    const products = await Product.find({ isAvailable: true })
      .select('name category price isFeatured')
      .limit(30);

    // Generate AI response (hybrid system)
    const reply = await generateAIResponse({
      message: message.trim(),
      products,
      history,
      userId,
    });

    // Save conversation to memory
    saveMessage(userId, 'user', message.trim());
    saveMessage(userId, 'assistant', reply);

    // Get session metadata
    const sessionInfo = getSessionMetadata(userId);

    res.status(200).json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
        session: sessionInfo,
      },
    });
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI chat failed',
    });
  }
};

/**
 * Get AI product recommendations
 * @route POST /api/ai/recommend
 * @access Public
 */
export const recommendHandler = async (req, res) => {
  try {
    const { preference, category } = req.body;

    // Build query
    let query = { isAvailable: true };
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .select('name description price category freshnessTag isFeatured')
      .limit(20);

    // Get AI recommendations if preference provided
    if (preference) {
      const recommendations = await getRecommendations({
        preference,
        products,
      });

      return res.status(200).json({
        success: true,
        data: {
          recommendations,
          preference,
          total: recommendations.length,
        },
      });
    }

    // Return featured products if no preference
    const featured = products.filter((p) => p.isFeatured).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        recommendations: featured,
        products,
        total: products.length,
      },
    });
  } catch (error) {
    console.error('[AI Recommend] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations',
    });
  }
};

/**
 * Get quick suggestions
 * @route GET /api/ai/suggestions
 * @access Public
 */
export const suggestionsHandler = async (req, res) => {
  try {
    const suggestions = [
      {
        label: 'Suggest recipes',
        query: 'What recipes can I make with chicken breast?',
        icon: '🍳',
      },
      {
        label: 'Best chicken cuts',
        query: 'What are the best chicken cuts for grilling?',
        icon: '🍗',
      },
      {
        label: "Today's offers",
        query: 'What are today\'s special offers?',
        icon: '🎉',
      },
      {
        label: 'Delivery info',
        query: 'How long does delivery take?',
        icon: '🚚',
      },
      {
        label: 'Subscription plans',
        query: 'Tell me about subscription plans',
        icon: '📅',
      },
      {
        label: 'Freshness guarantee',
        query: 'How do you ensure freshness?',
        icon: '✅',
      },
    ];

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('[AI Suggestions] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get suggestions',
    });
  }
};

/**
 * Test AI connection and configuration
 * @route GET /api/ai/test
 * @access Private/Admin
 */
export const testHandler = async (req, res) => {
  try {
    const config = getConfigStatus();

    res.status(200).json({
      success: true,
      data: {
        ...config,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[AI Test] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI test failed',
    });
  }
};

/**
 * Clear conversation history
 * @route DELETE /api/ai/chat/history
 * @access Private
 */
export const clearHistoryHandler = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.ip || 'guest';
    
    // Clear from memory
    const { clearHistory } = await import('./ai.memory.js');
    clearHistory(userId);

    res.status(200).json({
      success: true,
      message: 'Chat history cleared',
    });
  } catch (error) {
    console.error('[AI Clear History] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear history',
    });
  }
};

/**
 * Get conversation history
 * @route GET /api/ai/chat/history
 * @access Private
 */
export const getHistoryHandler = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.ip || 'guest';
    const history = getHistory(userId);
    const metadata = getSessionMetadata(userId);

    res.status(200).json({
      success: true,
      data: {
        history,
        metadata,
      },
    });
  } catch (error) {
    console.error('[AI Get History] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get history',
    });
  }
};

/**
 * Track order via chat
 * @route POST /api/ai/chat/track
 * @access Private
 */
export const trackOrderHandler = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const { orderId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let order;
    if (orderId) {
      order = await Order.findById(orderId).populate('items.product', 'name image');
    } else {
      order = await Order.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate('items.product', 'name image');
    }

    if (!order) {
      return res.status(200).json({
        success: true,
        data: {
          reply: '❌ No orders found. Would you like to browse our products?',
          order: null,
        },
      });
    }

    const formattedStatus = formatOrderStatus(order, 'english');

    res.status(200).json({
      success: true,
      data: {
        reply: formattedStatus,
        order: {
          id: order._id,
          status: order.orderStatus,
          total: order.finalAmount,
          items: order.items.length,
          createdAt: order.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[AI Track Order] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track order',
    });
  }
};

/**
 * Add product to cart via chat
 * @route POST /api/ai/chat/cart/add
 * @access Private
 */
export const addToCartHandler = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const { productName, quantity = 1 } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Product name required',
      });
    }

    const result = await addToCartByName(userId, productName, quantity);

    if (result.success) {
      const cartSummary = await getCartSummary(userId);

      return res.status(200).json({
        success: true,
        data: {
          reply: `✅ ${result.product.name} added to cart!`,
          product: result.product,
          cart: cartSummary,
        },
      });
    }

    res.status(404).json({
      success: false,
      data: {
        reply: result.message,
      },
    });
  } catch (error) {
    console.error('[AI Add to Cart] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add to cart',
    });
  }
};

/**
 * Get cart summary via chat
 * @route GET /api/ai/chat/cart
 * @access Private
 */
export const getCartHandler = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price image category')
      .lean();

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          reply: '🛒 Your cart is empty. Start adding some fresh products!',
          cart: null,
        },
      });
    }

    let reply = '🛒 *Your Cart:*\n\n';
    cart.items.forEach((item, index) => {
      const name = item.name || item.product?.name || 'Unknown';
      reply += `${index + 1}. ${name} x ${item.quantity} - ₹${item.price * item.quantity}\n`;
    });
    reply += `\n💰 *Total:* ₹${cart.finalAmount}`;

    if (cart.deliveryFee === 0) {
      reply += ' (Free Delivery! 🎉)';
    } else {
      reply += ` (+ ₹${cart.deliveryFee} delivery)`;
    }

    res.status(200).json({
      success: true,
      data: {
        reply,
        cart: {
          itemCount: cart.items.length,
          totalAmount: cart.totalAmount,
          finalAmount: cart.finalAmount,
          deliveryFee: cart.deliveryFee,
        },
      },
    });
  } catch (error) {
    console.error('[AI Get Cart] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cart',
    });
  }
};

/**
 * Get recipe recommendations
 * @route POST /api/ai/chat/recipe
 * @access Public
 */
export const getRecipeHandler = async (req, res) => {
  try {
    const { query, language = 'english' } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Recipe query required',
      });
    }

    const result = getRecipeRecommendation(query, language);

    if (result.found) {
      return res.status(200).json({
        success: true,
        data: {
          reply: result.response,
          recipes: result.recipes || (result.recipe ? [result.recipe] : []),
        },
      });
    }

    // Not found in local DB — try Gemini AI
    try {
      const { default: geminiService } = await import('../../utils/geminiService.js');
      const aiRecipe = await geminiService.generateRecipe('', query, language === 'tamil' ? 'Tamil style' : '');
      return res.status(200).json({
        success: true,
        data: { reply: aiRecipe, recipes: [] },
      });
    } catch {
      // Gemini failed — return not found
    }

    res.status(200).json({
      success: true,
      data: {
        reply: language === 'tamil'
          ? 'மன்னிக்கவும், இந்த வகையான ரெசிபி கிடைக்கவில்லை. வேறு ஏதேனும் முயற்சிக்க விரும்புகிறீர்களா?'
          : "Sorry, I couldn't find a recipe for that. Try: Chicken 65, Biryani, Shawarma, Tikka, Lollipop, Dragon Chicken, Curry, Grilled, Wings, or Kebab.",
        recipes: [],
      },
    });
  } catch (error) {
    console.error('[AI Get Recipe] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recipe',
    });
  }
};

/**
 * Get personalized recommendations
 * @route GET /api/ai/chat/recommend
 * @access Private
 */
export const getPersonalizedRecommendHandler = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const reorderSuggestions = await getReorderSuggestions(userId);
    const products = await Product.find({ isAvailable: true })
      .select('name category price isFeatured')
      .limit(20);

    if (reorderSuggestions.length > 0) {
      let reply = '🛒 *Based on your order history:*\n\n';
      reorderSuggestions.forEach((item, index) => {
        reply += `${index + 1}. ${item.name} (Ordered ${item.count} times)\n`;
      });
      reply += '\nWant to add any of these to your cart?';

      return res.status(200).json({
        success: true,
        data: {
          reply,
          recommendations: reorderSuggestions,
          type: 'reorder',
        },
      });
    }

    // No history, return featured products
    const featured = products.filter((p) => p.isFeatured).slice(0, 5);
    let reply = '🌟 *Today\'s Specials:*\n\n';
    featured.forEach((product, index) => {
      reply += `${index + 1}. ${product.name} - ₹${product.price}/kg\n`;
    });

    res.status(200).json({
      success: true,
      data: {
        reply,
        recommendations: featured,
        type: 'featured',
      },
    });
  } catch (error) {
    console.error('[AI Personalized Recommend] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations',
    });
  }
};

/**
 * Quick recipe suggestion
 * @route GET /api/ai/chat/recipe/quick
 * @access Public
 */
export const quickRecipeHandler = async (req, res) => {
  try {
    const { context = 'quick' } = req.query;
    const suggestion = getQuickRecipeSuggestion(context);

    res.status(200).json({
      success: true,
      data: {
        reply: suggestion.message,
        recipe: suggestion.recipe,
      },
    });
  } catch (error) {
    console.error('[AI Quick Recipe] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get quick recipe',
    });
  }
};

export default {
  chatHandler,
  recommendHandler,
  suggestionsHandler,
  testHandler,
  clearHistoryHandler,
  getHistoryHandler,
  trackOrderHandler,
  addToCartHandler,
  getCartHandler,
  getRecipeHandler,
  getPersonalizedRecommendHandler,
  quickRecipeHandler,
};
