/**
 * AI Routes
 * All AI-powered chatbot endpoints with hybrid AI features
 */

import express from 'express';
import {
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
} from './ai.controller.js';
import { protect, admin } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI assistant (hybrid AI system)
 * @access  Public (with optional auth for context)
 */
router.post('/chat', chatHandler);

/**
 * @route   POST /api/ai/recommend
 * @desc    Get AI product recommendations
 * @access  Public
 */
router.post('/recommend', recommendHandler);

/**
 * @route   GET /api/ai/suggestions
 * @desc    Get quick suggestion prompts
 * @access  Public
 */
router.get('/suggestions', suggestionsHandler);

/**
 * @route   GET /api/ai/test
 * @desc    Test AI connection and configuration
 * @access  Private/Admin
 */
router.get('/test', protect, admin, testHandler);

/**
 * @route   GET /api/ai/chat/history
 * @desc    Get user's conversation history
 * @access  Private
 */
router.get('/chat/history', protect, getHistoryHandler);

/**
 * @route   DELETE /api/ai/chat/history
 * @desc    Clear user's conversation history
 * @access  Private
 */
router.delete('/chat/history', protect, clearHistoryHandler);

/**
 * @route   POST /api/ai/chat/track
 * @desc    Track order status via chat
 * @access  Private
 */
router.post('/chat/track', protect, trackOrderHandler);

/**
 * @route   POST /api/ai/chat/cart/add
 * @desc    Add product to cart via chat
 * @access  Private
 */
router.post('/chat/cart/add', protect, addToCartHandler);

/**
 * @route   GET /api/ai/chat/cart
 * @desc    Get cart summary via chat
 * @access  Private
 */
router.get('/chat/cart', protect, getCartHandler);

/**
 * @route   POST /api/ai/chat/recipe
 * @desc    Get recipe recommendations
 * @access  Public
 */
router.post('/chat/recipe', getRecipeHandler);

/**
 * @route   GET /api/ai/chat/recommend
 * @desc    Get personalized recommendations based on order history
 * @access  Private
 */
router.get('/chat/recommend', protect, getPersonalizedRecommendHandler);

/**
 * @route   GET /api/ai/chat/recipe/quick
 * @desc    Get quick recipe suggestion
 * @access  Public
 */
router.get('/chat/recipe/quick', quickRecipeHandler);

export default router;
