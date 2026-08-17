import { Ollama } from 'ollama';
import Product from '../models/Product.js';

class OllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    });
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
    this.isInitialized = false;
  }

  /**
   * Initialize and test Ollama connection
   */
  async initialize() {
    try {
      await this.ollama.list();
      this.isInitialized = true;
      console.log('✅ Ollama connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Ollama connection failed:', error.message);
      console.log('📝 Make sure Ollama is running: ollama serve');
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Chat with AI assistant
   * @param {string} message - User message
   * @param {array} context - Additional context (products, orders, etc.)
   * @returns {Promise<string>} AI response
   */
  async chat(message, context = {}) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return this.getFallbackResponse(message);
      }
    }

    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        stream: false,
      });

      return response.message.content;
    } catch (error) {
      console.error('Ollama chat error:', error.message);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Build system prompt with context
   * @private
   */
  buildSystemPrompt(context = {}) {
    const { products = [], categories = [] } = context;

    let prompt = `You are an AI assistant for CluckFresh Hub (also known as Mathina FreshHub), a fresh chicken marketplace in Chennai.

🎯 YOUR ROLE:
- Help users choose chicken products
- Suggest recipes based on available products
- Answer FAQs about delivery, freshness, and quality
- Provide information about our products and services
- Be friendly, helpful, and concise

📦 AVAILABLE PRODUCTS:
${products.length > 0 ? products.map(p => `- ${p.name} (₹${p.price}) - ${p.description}`).join('\n') : 'Fresh chicken cuts, eggs, marinades, and ready-to-cook items'}

🏷️ PRODUCT CATEGORIES:
${categories.length > 0 ? categories.join(', ') : 'Chicken Cuts, Eggs, Marinades, Ready-to-Cook, Live Chicken, Organs'}

🚫 IMPORTANT RULES:
- NEVER handle payments or pricing decisions
- NEVER modify orders or process transactions
- ALWAYS direct payment/order issues to customer support
- Keep responses short and helpful (2-3 sentences max)
- Be specific about Chennai delivery areas
- Mention our tagline: "Fresh Chicken. Smarter Delivery."

💡 SUGGESTIONS YOU CAN MAKE:
- Product recommendations based on user needs
- Recipe ideas using our products
- Combo suggestions (e.g., chicken + marinade)
- Festival special offers
- Subscription benefits

🌍 LOCAL CONTEXT:
- Based in Chennai, Tamil Nadu
- Same-day delivery for orders before 2 PM
- Free delivery above ₹500
- All products are halal-certified and organic

Respond in a friendly, conversational tone. If asked about something outside your knowledge, politely direct them to contact support.`;

    return prompt;
  }

  /**
   * Get fallback response when AI is unavailable
   * @private
   */
  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Product-related queries
    if (lowerMessage.includes('product') || lowerMessage.includes('chicken') || lowerMessage.includes('buy')) {
      return "We offer fresh chicken cuts, eggs, marinades, and ready-to-cook items! All our products are organic, antibiotic-free, and halal-certified. Check out our Products page to see the full range. 🍗";
    }

    // Delivery queries
    if (lowerMessage.includes('deliver') || lowerMessage.includes('shipping')) {
      return "We offer same-day delivery in Chennai for orders placed before 2 PM! Free delivery on orders above ₹500. We deliver to all major areas in Chennai. 🚚";
    }

    // Recipe queries
    if (lowerMessage.includes('recipe') || lowerMessage.includes('cook') || lowerMessage.includes('prepare')) {
      return "Try our AI Recipe Generator! It creates personalized recipes based on your order history. Go to the AI Recipes page to get started. 👨‍🍳";
    }

    // Price queries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "Our prices start from ₹84 for eggs and vary by product. Check the Products page for current prices. We offer great value for premium quality! 💰";
    }

    // Subscription queries
    if (lowerMessage.includes('subscription') || lowerMessage.includes('weekly') || lowerMessage.includes('regular')) {
      return "Our subscription plans let you get fresh chicken delivered regularly! Choose weekly, bi-weekly, or monthly plans. You can pause or cancel anytime. 📅";
    }

    // Contact/Support
    if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return "Need help? Contact us at MathinaFreshHub@gmail.com or call +91 98765 43210. We're here Mon-Sun, 6 AM - 10 PM! 📞";
    }

    // Default response
    return "Welcome to CluckFresh Hub! 🐔 I'm here to help you find the freshest chicken products. Ask me about our products, delivery, recipes, or subscriptions. Visit our Products page to explore!";
  }

  /**
   * Get product recommendations
   * @param {string} preference - User preference
   * @returns {Promise<array>} Recommended products
   */
  async getRecommendations(preference) {
    const context = {
      products: await Product.find({ isAvailable: true }).limit(20),
    };

    const prompt = `Based on this preference: "${preference}", recommend 3-5 products from our available items. Return ONLY product names, comma-separated.`;

    try {
      const response = await this.chat(prompt, context);
      const productNames = response.split(',').map(name => name.trim());
      
      const products = await Product.find({
        name: { $in: productNames },
        isAvailable: true,
      }).limit(5);

      return products;
    } catch (error) {
      console.error('Get recommendations error:', error);
      return [];
    }
  }

  /**
   * Check if Ollama is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.isInitialized;
  }

  /**
   * Get available models
   * @returns {Promise<array>}
   */
  async getAvailableModels() {
    try {
      const models = await this.ollama.list();
      return models.models.map(m => m.name);
    } catch (error) {
      console.error('Get models error:', error);
      return [];
    }
  }
}

// Export singleton instance
const ollamaService = new OllamaService();
export default ollamaService;
