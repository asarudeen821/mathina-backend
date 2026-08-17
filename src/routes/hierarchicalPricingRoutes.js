import express from 'express';
import {
  getPricingStructure,
  updateGlobalPrice,
  updateCutPricing,
  getPricingHistory,
} from '../controllers/hierarchicalPricingController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect, admin);

router.get('/', getPricingStructure);
router.put('/global', updateGlobalPrice);
router.put('/cut/:cutName', updateCutPricing);
router.get('/history', getPricingHistory);

export default router;
