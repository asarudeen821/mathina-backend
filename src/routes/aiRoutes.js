import express from 'express';
import { generateRecipe, getMealSuggestions } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Legacy Gemini AI routes (for recipe generation)
// New modular AI chatbot routes are in /modules/ai/ai.routes.js
router.post('/recipe', protect, generateRecipe);
router.get('/suggestions', protect, getMealSuggestions);

export default router;
