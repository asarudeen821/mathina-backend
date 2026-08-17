import express from 'express';
import {
  createSubscription,
  getMySubscriptions,
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  skipDelivery,
  getAllSubscriptions,
  processSubscriptionOrders,
} from '../controllers/subscriptionController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Static routes MUST come before /:id
router.get('/my-subscriptions', protect, getMySubscriptions);
router.get('/admin/all', protect, admin, getAllSubscriptions);
router.post('/process', protect, admin, processSubscriptionOrders);

// Customer routes
router.post('/', protect, createSubscription);
router.get('/:id', protect, getSubscription);
router.put('/:id/pause', protect, pauseSubscription);
router.put('/:id/resume', protect, resumeSubscription);
router.put('/:id/cancel', protect, cancelSubscription);
router.put('/:id/skip', protect, skipDelivery);

export default router;
