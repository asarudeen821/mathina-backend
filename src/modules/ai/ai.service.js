/**
 * AI Service - Core Logic for Chatbot
 * Supports both OpenAI and Ollama (fallback)
 * Hybrid AI: Rules Engine + AI Enhancement
 */

import OpenAI from 'openai';
import ollamaService from '../../utils/ollamaService.js';
import geminiService from '../../utils/geminiService.js';
import { SYSTEM_PROMPT } from './ai.prompts.js';
import { detectIntent, detectLanguage } from '../../utils/intent.js';
import { getRecipeRecommendation } from '../../services/recipe.engine.js';
import { getLatestOrder, getOrderById, estimateDeliveryTime } from '../../services/order.service.js';
import { formatOrderStatus, formatDeliveryEstimate } from '../../services/order.format.js';
import { addToCartByName, getCartSummary } from '../../services/cart.service.js';
import { getUserPreferences, buildPersonalizationContext, getReorderSuggestions } from '../../services/user.service.js';

// Initialize OpenAI client
let openai;
const isOpenAIEnabled = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';

if (isOpenAIEnabled) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate AI response using OpenAI or Ollama
 * @param {Object} params - Parameters
 * @param {string} params.message - User message
 * @param {Array} params.products - Available products for context
 * @param {Array} params.history - Conversation history
 * @param {string} params.userId - User identifier
 * @returns {Promise<string>} AI response
 */
export const generateAIResponse = async ({ message, products = [], history = [], userId }) => {
  try {
    // STEP 1: Detect intent (fast rule-based)
    const intent = detectIntent(message);

    // STEP 2: Detect language
    const language = detectLanguage(message);

    // STEP 3: Get user preferences for personalization
    const userPrefs = await getUserPreferences(userId);
    const preferredLanguage = userPrefs?.language || language;

    // STEP 4: Handle intents with rule engine first
    // Order Tracking Intent
    if (intent.intent === 'tracking') {
      const orderResponse = await handleTrackingIntent(userId, intent.data, preferredLanguage);
      if (orderResponse) {
        return orderResponse;
      }
    }

    // Recipe Intent
    if (intent.intent === 'recipe') {
      const recipeResponse = handleRecipeIntent(message, preferredLanguage);
      if (recipeResponse) {
        return recipeResponse;
      }
    }

    // Cart Intent
    if (intent.intent === 'cart') {
      const cartResponse = await handleCartIntent(userId, message, products, preferredLanguage);
      if (cartResponse) {
        return cartResponse;
      }
    }

    // Greeting Intent
    if (intent.intent === 'greeting') {
      return handleGreetingIntent(userPrefs?.name, preferredLanguage);
    }

    // STEP 5: For general queries, use AI with context
    // Build system prompt with personalization
    const personalizationContext = await buildPersonalizationContext(userId);
    const systemPrompt = buildSystemPrompt(products, personalizationContext, preferredLanguage);

    // Prepare messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Try OpenAI first if enabled
    if (isOpenAIEnabled && openai) {
      try {
        const response = await generateWithOpenAI(messages);
        return response;
      } catch (openAIError) {
        console.warn('[AI Service] OpenAI failed, trying Gemini:', openAIError.message);
      }
    }

    // Try Gemini
    try {
      const response = await generateWithGemini(message, products, preferredLanguage);
      return response;
    } catch (geminiError) {
      console.warn('[AI Service] Gemini failed, trying Ollama:', geminiError.message);
    }

    // Fallback to Ollama
    try {
      const response = await generateWithOllama(message, products, history, preferredLanguage);
      return response;
    } catch (ollamaError) {
      console.error('[AI Service] All AI providers failed:', ollamaError.message);
      throw new Error('All AI providers failed');
    }
  } catch (error) {
    console.error('[AI Service] Critical error:', error);
    return getFallbackResponse(message);
  }
};

/**
 * Handle order tracking intent
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID (optional)
 * @param {string} language - Language preference
 * @returns {Promise<string>} Formatted response
 */
const handleTrackingIntent = async (userId, orderId, language) => {
  try {
    let order;

    if (orderId) {
      order = await getOrderById(orderId, userId);
    } else {
      order = await getLatestOrder(userId);
    }

    if (!order) {
      return language === 'tamil'
        ? '❌ ஆர்டர் எதுவும் கிடைக்கவில்லை. புதிய ஆர்டர் செய்ய விரும்புகிறீர்களா?'
        : '❌ No orders found. Would you like to place a new order?';
    }

    const formattedStatus = formatOrderStatus(order, language);
    const eta = estimateDeliveryTime(order);
    const deliveryMsg = formatDeliveryEstimate(order, language, eta);

    return `${formattedStatus}\n\n${deliveryMsg}`;
  } catch (error) {
    console.error('[AI Service] Tracking intent error:', error);
    return null;
  }
};

/**
 * Handle recipe intent
 * @param {string} message - User message
 * @param {string} language - Language preference
 * @returns {string|null} Recipe response
 */
const handleRecipeIntent = (message, language) => {
  try {
    const result = getRecipeRecommendation(message, language);

    if (result.found) {
      return result.response;
    }

    return null;
  } catch (error) {
    console.error('[AI Service] Recipe intent error:', error);
    return null;
  }
};

/**
 * Handle cart intent
 * @param {string} userId - User ID
 * @param {string} message - User message
 * @param {Array} products - Available products
 * @param {string} language - Language preference
 * @returns {Promise<string|null>} Cart response
 */
const handleCartIntent = async (userId, message, products, language) => {
  try {
    // Extract product name from message
    const productMatch = products.find((p) => {
      const nameMatch = message.toLowerCase().includes(p.name.toLowerCase());
      const categoryMatch = message.toLowerCase().includes(p.category.toLowerCase());
      return nameMatch || categoryMatch;
    });

    if (productMatch) {
      const result = await addToCartByName(userId, productMatch.name, 1);

      if (result.success) {
        const isTamil = language === 'tamil';
        return isTamil
          ? `✅ ${productMatch.name} கார்ட்டில் சேர்க்கப்பட்டது! மேலும் ஏதேனும் வேண்டுமா?`
          : `✅ ${productMatch.name} added to cart! Want anything else?`;
      } else {
        return language === 'tamil'
          ? `❌ பொருள் கிடைக்கவில்லை: ${productMatch.name}`
          : `❌ Product not available: ${productMatch.name}`;
      }
    }

    // No product match, let AI handle it
    return null;
  } catch (error) {
    console.error('[AI Service] Cart intent error:', error);
    return null;
  }
};

/**
 * Handle greeting intent
 * @param {string} userName - User name
 * @param {string} language - Language preference
 * @returns {string} Greeting response
 */
const handleGreetingIntent = (userName, language) => {
  const isTamil = language === 'tamil';

  if (userName) {
    return isTamil
      ? `வணக்கம் ${userName}! 🙏 Mathina FreshHub-க்கு வரவேற்கிறோம். இன்று என்ன வாங்க விரும்புகிறீர்கள்?`
      : `Hello ${userName}! 🙏 Welcome to Mathina FreshHub. What would you like to order today?`;
  }

  return isTamil
    ? 'வணக்கம்! 🙏 Mathina FreshHub-க்கு வரவேற்கிறோம். எப்படி உதவ முடியும்?'
    : 'Hello! 🙏 Welcome to Mathina FreshHub. How can I help you today?';
};

/**
 * Generate response using OpenAI
 * @param {Array} messages - Message array
 * @returns {Promise<string>} Response
 */
const generateWithOpenAI = async (messages) => {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    max_tokens: 500,
    temperature: 0.7,
    top_p: 0.9,
  });

  return response.choices[0].message.content;
};

/**
 * Generate response using Gemini
 * @param {string} message - User message
 * @param {Array} products - Products context
 * @param {string} language - Language preference
 * @returns {Promise<string>} Response
 */
const generateWithGemini = async (message, products = [], language = 'english') => {
  const productList = products.map(p => `${p.name} (${p.category}): ₹${p.price}/kg`).join(', ');
  const langNote = language === 'tamil' ? ' Respond in Tamil or Tanglish.' : '';
  const prompt = `You are the AI assistant for Mathina FreshHub, a chicken marketplace in Chennai. Help with recipes, products, delivery, and orders. Be concise and friendly.${langNote}

Available products: ${productList || 'Fresh chicken cuts, eggs, marinades'}

User: ${message}`;

  return await geminiService.chat(prompt);
};

/**
 * Generate response using Ollama
 * @param {string} message - User message
 * @param {Array} products - Products context
 * @param {Array} history - Conversation history
 * @param {string} language - Language preference
 * @returns {Promise<string>} Response
 */
const generateWithOllama = async (message, products, history, language = 'english') => {
  const systemPrompt = buildSystemPrompt(products, '', language);

  // Build context string for Ollama
  const context = {
    system: systemPrompt,
    history: history.slice(-5), // Last 5 messages for context
    language,
  };

  return await ollamaService.chat(message, context);
};

/**
 * Build system prompt with product context
 * @param {Array} products - Available products
 * @param {string} personalizationContext - User personalization context
 * @param {string} language - Language preference
 * @returns {string} System prompt
 */
const buildSystemPrompt = (products = [], personalizationContext = '', language = 'english') => {
  let prompt = SYSTEM_PROMPT;

  // Add personalization context
  if (personalizationContext) {
    prompt += `\n\n${personalizationContext}`;
  }

  // Add language instruction
  if (language === 'tamil') {
    prompt += `\n\nIMPORTANT: User prefers Tamil. Respond in Tamil (or Tanglish - Tamil + English mix).`;
  }

  if (products.length > 0) {
    const productList = products
      .map((p) => `- ${p.name} (${p.category}): ₹${p.price}/kg`)
      .join('\n');

    prompt += `\n\n## Currently Available Products\n${productList}`;
  }

  return prompt;
};

/**
 * Get fallback response when AI providers fail
 * @param {string} userMessage - Original user message
 * @returns {string} Fallback response
 */
const getFallbackResponse = (userMessage) => {
  const fallbacks = [
    "Thanks for your message! I'm having trouble connecting to my AI brain right now 🧠. For immediate assistance, please call our support team!",
    "Oops! Something went wrong on my end. Please try again in a moment, or contact our customer support for help.",
    "I'm experiencing technical difficulties. For urgent queries, please reach out to our team at support@mathinafreshhub.com",
  ];

  // Add context-aware fallback
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "I'm unable to fetch live prices right now. Please visit our store or call us for today's rates. Sorry for the inconvenience! 🙏";
  }
  if (lowerMessage.includes('recipe')) {
    return "I'd love to share a recipe! For now, try our classic Chicken Chettinad - perfect with rice. Visit our products page for fresh ingredients! 🍗";
  }
  if (lowerMessage.includes('delivery')) {
    return "We deliver within 2-4 hours in Chennai. For specific delivery queries, please call our support team! 🚚";
  }

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

/**
 * Get product recommendations using AI
 * @param {Object} params - Parameters
 * @param {string} params.preference - User preference
 * @param {Array} params.products - Available products
 * @returns {Promise<Array>} Recommendations
 */
export const getRecommendations = async ({ preference, products = [] }) => {
  try {
    if (products.length === 0) {
      return [];
    }

    // Simple recommendation logic (can be enhanced with AI)
    const preferenceLower = preference.toLowerCase();
    
    // Match by category or name
    const recommendations = products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(preferenceLower);
      const categoryMatch = product.category.toLowerCase().includes(preferenceLower);
      return nameMatch || categoryMatch;
    });

    // If no matches, return featured products
    if (recommendations.length === 0) {
      return products.filter((p) => p.isFeatured).slice(0, 5);
    }

    return recommendations.slice(0, 5);
  } catch (error) {
    console.error('[AI Service] Recommendation error:', error);
    return [];
  }
};

/**
 * Check if AI service is configured
 * @returns {Object} Configuration status
 */
export const getConfigStatus = () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const isGeminiEnabled = !!(geminiKey && geminiKey !== 'your_gemini_api_key_here');
  return {
    openai: {
      configured: isOpenAIEnabled,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    gemini: {
      configured: isGeminiEnabled,
      model: 'gemini-1.5-flash',
    },
    ollama: {
      configured: ollamaService.isConfigured(),
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    },
    activeProvider: isOpenAIEnabled ? 'openai' : isGeminiEnabled ? 'gemini' : 'ollama',
  };
};

export default {
  generateAIResponse,
  getRecommendations,
  getConfigStatus,
};
