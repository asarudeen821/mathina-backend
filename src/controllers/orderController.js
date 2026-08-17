import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      deliveryTime,
      deliverySlot,
      deliveryInstructions,
      paymentMethod,
      upiId,
      paymentStatus,
      isSubscriptionOrder,
      subscription,
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one item to order',
      });
    }

    // Calculate total and validate stock
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Skip validation for virtual products (e.g., showcase products)
      if (item.isVirtual) {
        orderItems.push({
          product: item.product,
          name: item.name || 'Virtual Product',
          quantity: item.quantity,
          weight: item.weight,
          price: item.price,
          image: item.image || null,
          isVirtual: true,
        });
        totalAmount += item.price * item.quantity;
        continue;
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product || item.name}`,
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      // Use price from request if provided (weight-based pricing), else fall back to product.price
      const unitPrice = item.price && item.price > 0 ? item.price : product.price;
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        weight: item.weight,
        price: unitPrice,
        image: product.images?.[0]?.url,
        isVirtual: false,
      });
    }

    // Apply discount if any
    const discount = 0; // Can add coupon logic here
    const finalAmount = totalAmount - discount;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      discount,
      finalAmount,
      deliveryAddress: {
        ...deliveryAddress,
        phone: req.user.phone,
      },
      deliveryTime,
      deliverySlot,
      deliveryInstructions,
      paymentInfo: {
        method: paymentMethod || 'cod',
        status: paymentMethod === 'upi' && paymentStatus === 'paid' ? 'paid' : 'pending',
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        paidAt: paymentMethod === 'upi' && paymentStatus === 'paid' ? new Date() : undefined,
      },
      isSubscriptionOrder,
      subscription,
      loyaltyPointsEarned: Math.floor(finalAmount / 10), // 1 point per ₹10
    });

    // Update product stock (skip virtual products)
    for (const item of items) {
      if (!item.isVirtual) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    // Update user loyalty points
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { loyaltyPoints: Math.floor(finalAmount / 10) },
    });

    // Notify all admins about the new order
    try {
      const admins = await User.find({ role: 'admin' });
      const isPaid = order.paymentInfo?.status === 'paid';
      const paymentMsg = isPaid ? ' (Paid via UPI)' : ' (Cash on Delivery)';
      for (const adminUser of admins) {
        await Notification.create({
          user: adminUser._id,
          order: order._id,
          type: 'pending',
          title: 'New Order Received',
          message: `🛍️ Customer ${req.user.name} placed a new order #${order._id.slice(-8)} for ₹${finalAmount}${paymentMsg}.`,
        });
      }
    } catch (err) {
      console.error('Failed to notify admins about new order:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { user: req.user._id };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .populate('items.product', 'name images');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order',
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;

    let query = {};
    if (status) {
      query.orderStatus = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders',
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, deliveryBoy, tracking, cancellationReason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (deliveryBoy) order.deliveryBoy = deliveryBoy;
    if (tracking) order.tracking = { ...order.tracking, ...tracking };
    if (cancellationReason) order.cancellationReason = cancellationReason;

    // Update tracking based on status
    if (orderStatus === 'confirmed') order.tracking.confirmed = true;
    if (orderStatus === 'processing') order.tracking.processing = true;
    if (orderStatus === 'out-for-delivery') order.tracking.outForDelivery = true;
    if (orderStatus === 'delivered') {
      order.tracking.delivered = true;
      order.paymentInfo.status = 'paid';
      order.paymentInfo.paidAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    // Can only cancel pending or confirmed orders
    if (['processing', 'out-for-delivery', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order at this stage',
      });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    // Notify all admins about the cancellation
    try {
      const admins = await User.find({ role: 'admin' });
      for (const adminUser of admins) {
        await Notification.create({
          user: adminUser._id,
          order: order._id,
          type: 'cancelled',
          title: 'Order Cancelled By Customer',
          message: `❌ Customer ${req.user.name} cancelled Order #${order._id.slice(-8)}. Reason: "${reason}"`,
        });
      }
    } catch (err) {
      console.error('Failed to notify admins about order cancellation:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order',
    });
  }
};

// @desc    Process Razorpay payment
// @route   POST /api/orders/:id/payment
// @access  Private
export const processPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify payment signature (implement proper verification)
    // This is a simplified version

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

    // Notify all admins about the payment confirmation
    try {
      const admins = await User.find({ role: 'admin' });
      for (const adminUser of admins) {
        await Notification.create({
          user: adminUser._id,
          order: order._id,
          type: 'confirmed',
          title: 'Order Payment Confirmed',
          message: `💳 Order #${order._id.slice(-8)} from ${req.user.name} has been paid successfully via UPI (₹${order.finalAmount}).`,
        });
      }
    } catch (err) {
      console.error('Failed to notify admins about payment confirmation:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment',
    });
  }
};

// @desc    Get order statistics (Admin only)
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order statistics',
    });
  }
};
