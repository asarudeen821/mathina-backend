import express from 'express';
import {
  chatWithAI,
  getRecommendations,
  testChat,
  getSuggestions,
  getChat,
  sendMessage,
  markAsRead,
  getAllChats,
  closeChat,
} from '../controllers/chatController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// AI Chat endpoints
router.post('/chat', chatWithAI);
router.post('/recommend', getRecommendations);
router.get('/suggestions', getSuggestions);
router.get('/test', protect, admin, testChat);

// Legacy chat endpoints (for customer support chat)
router.get('/order/:orderId', protect, getChat);
router.post('/:chatId/message', protect, sendMessage);
router.put('/:chatId/read', protect, markAsRead);
router.get('/', protect, admin, getAllChats);
router.put('/:chatId/close', protect, admin, closeChat);

export default router;
