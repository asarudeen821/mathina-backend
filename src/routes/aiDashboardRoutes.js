import express from 'express';
import { getAIInsights, getProductInsights } from '../controllers/aiDashboardController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and admin-only
router.use(protect, admin);

router.get('/insights', getAIInsights);
router.get('/product-insights', getProductInsights);

export default router;
