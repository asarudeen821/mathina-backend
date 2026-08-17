import express from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getCustomerAnalytics,
  getProductInsights,
  getAIInsights,
} from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/revenue', protect, admin, getRevenueAnalytics);
router.get('/customers', protect, admin, getCustomerAnalytics);
router.get('/products', protect, admin, getProductInsights);
router.get('/ai-insights', protect, admin, getAIInsights);

export default router;
