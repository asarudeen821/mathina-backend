import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  processPayment,
  getOrderStats,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Static routes MUST come before /:id to avoid Express treating them as id params
router.get('/my-orders', protect, getMyOrders);
router.get('/admin/all', protect, admin, getAllOrders);
router.get('/stats', protect, admin, getOrderStats);

// Dynamic routes
router.post('/', protect, createOrder);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/payment', protect, processPayment);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
