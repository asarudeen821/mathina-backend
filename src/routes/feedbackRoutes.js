import express from 'express';
import Feedback from '../models/Feedback.js';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/feedback/my - customer's own feedback (MUST be before /:orderId)
router.get('/my', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id }).populate('order', '_id createdAt');
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/feedback/admin/all - admin views all feedback (MUST be before /:orderId)
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'name email')
      .populate('order', '_id createdAt finalAmount')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/feedback/:orderId - customer submits feedback
router.post('/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders' });
    }

    const existing = await Feedback.findOne({ order: req.params.orderId });
    if (existing) return res.status(400).json({ success: false, message: 'Feedback already submitted' });

    const feedback = await Feedback.create({
      user: req.user._id,
      order: req.params.orderId,
      ...req.body,
    });
    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



export default router;
