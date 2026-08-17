import ollamaService from '../utils/ollamaService.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Chat from '../models/Chat.js';
import { processMessage, QUICK_SUGGESTIONS } from '../utils/slmEngine.js';

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Public (with optional auth for context)
export const chatWithAI = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    let reply;

    // Try Ollama first
    try {
      const dbContext = await buildDbContext(req.user?._id);
      reply = await ollamaService.chat(message, dbContext);
    } catch (ollamaError) {
      // Fallback to SLM Engine
      console.log('⚠️ Ollama unavailable, using SLM Engine fallback');
      reply = processMessage(message);
    }

    res.status(200).json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    
    // Ultimate fallback
    const fallbackReply = processMessage(message || '');
    
    res.status(200).json({
      success: true,
      data: {
        reply: fallbackReply,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// @desc    Get AI product recommendations
// @route   POST /api/ai/recommend
// @access  Public
export const getRecommendations = async (req, res) => {
  try {
    const { preference, category } = req.body;

    let query = { isAvailable: true };
    
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).limit(10);

    // Get AI to rank/recommend
    if (preference) {
      const context = { products };
      const prompt = `User preference: ${preference}. Recommend 3-5 products from the available list.`;
      
      // Just return products for now (AI recommendation can be added)
      return res.status(200).json({
        success: true,
        data: {
          products: products.slice(0, 5),
          preference,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        products: products.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations',
    });
  }
};

// @desc    Test Ollama connection
// @route   GET /api/ai/chat/test
// @access  Private/Admin
export const testChat = async (req, res) => {
  try {
    const isConnected = ollamaService.isConfigured();
    const models = await ollamaService.getAvailableModels();

    res.status(200).json({
      success: true,
      data: {
        connected: isConnected,
        models: models,
        currentModel: process.env.OLLAMA_MODEL || 'llama3.2',
        host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      },
    });
  } catch (error) {
    console.error('Test chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed',
    });
  }
};

// @desc    Get quick suggestions
// @route   GET /api/ai/chat/suggestions
// @access  Public
export const getSuggestions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: QUICK_SUGGESTIONS,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get suggestions',
    });
  }
};

// @desc    Get or create chat session
// @route   GET /api/chat/:orderId
// @access  Private
export const getChat = async (req, res) => {
  try {
    const { orderId } = req.params;

    let chat = await Chat.findOne({
      order: orderId,
      user: req.user._id,
      isActive: true,
    }).populate('user', 'name email')
      .populate('admin', 'name email');

    if (!chat) {
      // Create new chat session
      chat = await Chat.create({
        user: req.user._id,
        order: orderId,
        messages: [],
      });

      chat = await Chat.findById(chat._id)
        .populate('user', 'name email')
        .populate('admin', 'name email');
    }

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get chat',
    });
  }
};

// @desc    Send message in chat
// @route   POST /api/chat/:chatId/message
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Add message
    chat.messages.push({
      sender: req.user.role === 'admin' ? 'admin' : 'user',
      message: message.trim(),
      timestamp: new Date(),
    });

    chat.lastMessage = message.trim();
    chat.lastMessageAt = new Date();

    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('user', 'name email')
      .populate('admin', 'name email');

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: updatedChat,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Mark all messages from other party as read
    chat.messages.forEach((msg) => {
      if (
        (req.user.role === 'admin' && msg.sender === 'user') ||
        (req.user.role === 'customer' && msg.sender === 'admin')
      ) {
        msg.isRead = true;
      }
    });

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark messages as read',
    });
  }
};

// @desc    Get all chats (Admin only)
// @route   GET /api/chat
// @access  Private/Admin
export const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({ isActive: true })
      .sort({ lastMessageAt: -1 })
      .populate('user', 'name email phone')
      .populate('admin', 'name email');

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get chats',
    });
  }
};

// @desc    Close chat (Admin only)
// @route   PUT /api/chat/:chatId/close
// @access  Private/Admin
export const closeChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { isActive: false },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat closed successfully',
      data: chat,
    });
  } catch (error) {
    console.error('Close chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to close chat',
    });
  }
};

/**
 * Build context from database
 * @private
 */
async function buildDbContext(userId) {
  const context = {};

  // Get products
  const products = await Product.find({ isAvailable: true })
    .select('name description price category freshnessTag')
    .limit(20);
  context.products = products;

  // Get categories
  const categories = await Product.distinct('category');
  context.categories = categories;

  // If user is authenticated, get their order history
  if (userId) {
    const orders = await Order.find({ user: userId })
      .select('items orderStatus createdAt')
      .limit(5);
    context.recentOrders = orders;
  }

  return context;
}
