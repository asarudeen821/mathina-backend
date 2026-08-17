import express from 'express';
import {
  createCoupon,
  validateCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  deactivateCoupon,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public route for validating coupons (protect is optional — user may or may not be logged in)
router.post('/validate', protect, validateCoupon);

// Protected admin routes
router.use(protect, admin);

router.route('/')
  .get(getCoupons)
  .post(createCoupon);

router.route('/:id')
  .get(getCouponById)
  .put(updateCoupon)
  .delete(deleteCoupon);

router.put('/:id/deactivate', deactivateCoupon);

export default router;
