import express from 'express';
import razorpayService from '../utils/razorpayService.js';
import { protect } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    // Check if Razorpay is configured
    if (!razorpayService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured. Please add valid API keys.',
        testMode: true,
      });
    }

    // Create Razorpay order
    const result = await razorpayService.createOrder(
      amount,
      'INR',
      orderId || `order_${Date.now()}`
    );

    res.status(200).json({
      success: true,
      data: {
        orderId: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
        key: process.env.RAZORPAY_KEY_ID, // Public key for frontend
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order',
    });
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details',
      });
    }

    // Verify payment signature
    const verification = razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (verification.success) {
      // Update order with payment details
      const order = await Order.findById(orderId);

      if (order) {
        order.paymentInfo = {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'paid',
          method: 'upi',
          paidAt: new Date(),
        };
        order.orderStatus = 'confirmed';
        order.tracking.confirmed = true;
        await order.save();

        // Notify all admins about the verified payment
        try {
          const admins = await User.find({ role: 'admin' });
          for (const adminUser of admins) {
            await Notification.create({
              user: adminUser._id,
              order: order._id,
              type: 'confirmed',
              title: 'Order Payment Confirmed',
              message: `💳 Order #${order._id.slice(-8)} from ${req.user.name} has been paid successfully (₹${order.finalAmount}).`,
            });
          }
        } catch (err) {
          console.error('Failed to notify admins about verified payment:', err);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          paymentId: razorpay_payment_id,
          orderId,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: verification.message,
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed',
    });
  }
});

// @desc    Fetch payment status
// @route   GET /api/payment/status/:paymentId
// @access  Private
router.get('/status/:paymentId', protect, async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!razorpayService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured',
      });
    }

    const result = await razorpayService.fetchPayment(paymentId);

    res.status(200).json({
      success: true,
      data: result.payment,
    });
  } catch (error) {
    console.error('Fetch payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment status',
    });
  }
});

// @desc    Test Razorpay connection
// @route   GET /api/payment/test
// @access  Private/Admin
router.get('/test', protect, async (req, res) => {
  try {
    const isConfigured = razorpayService.isConfigured();
    const isConnected = await razorpayService.testConnection();

    res.status(200).json({
      success: true,
      data: {
        configured: isConfigured,
        connected: isConnected,
        keyId: process.env.RAZORPAY_KEY_ID
          ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...`
          : 'Not set',
      },
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed',
    });
  }
});

export default router;
