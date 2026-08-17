import express from 'express';
import {
  createPriceSchedule,
  getPriceSchedules,
  getPriceSchedule,
  getProductSchedules,
  updatePriceSchedule,
  deletePriceSchedule,
  applyScheduledPrices,
  getTodayPrices,
  getPriceHistory,
} from '../controllers/priceScheduleController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// Special routes (must come before /:id)
router.post('/apply', applyScheduledPrices);
router.get('/today', getTodayPrices);
router.get('/product/:productId', getProductSchedules);
router.get('/history/:productId', getPriceHistory);

// CRUD routes
router.route('/')
  .get(getPriceSchedules)
  .post(createPriceSchedule);

router.route('/:id')
  .get(getPriceSchedule)
  .put(updatePriceSchedule)
  .delete(deletePriceSchedule);

export default router;
