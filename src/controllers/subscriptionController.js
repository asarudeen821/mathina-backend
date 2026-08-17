import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Create subscription
// @route   POST /api/subscriptions
// @access  Private
export const createSubscription = async (req, res) => {
  try {
    const {
      planType,
      items,
      frequency,
      deliveryDay,
      deliveryTime,
      startDate,
      endDate,
      deliveryAddress,
      paymentMethod,
    } = req.body;

    // Validate items and calculate total
    let totalAmount = 0;
    const subscriptionItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      subscriptionItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        weight: item.weight,
        price: product.price,
      });
    }

    // Calculate next delivery date
    const nextDeliveryDate = new Date(startDate);

    const subscription = await Subscription.create({
      user: req.user._id,
      planType,
      items: subscriptionItems,
      totalAmount,
      frequency,
      deliveryDay,
      deliveryTime,
      startDate,
      endDate,
      nextDeliveryDate,
      deliveryAddress,
      paymentMethod,
      totalDeliveries: calculateTotalDeliveries(frequency, startDate, endDate),
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create subscription',
    });
  }
};

// @desc    Get user subscriptions
// @route   GET /api/subscriptions/my-subscriptions
// @access  Private
export const getMySubscriptions = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images');

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Get my subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscriptions',
    });
  }
};

// @desc    Get single subscription
// @route   GET /api/subscriptions/:id
// @access  Private
export const getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('items.product', 'name images')
      .populate('user', 'name email phone');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    // Check if user owns the subscription or is admin
    if (
      subscription.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this subscription',
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscription',
    });
  }
};

// @desc    Pause subscription
// @route   PUT /api/subscriptions/:id/pause
// @access  Private
export const pauseSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this subscription',
      });
    }

    subscription.status = 'paused';
    subscription.pauseReason = reason;
    subscription.pausedAt = new Date();
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription paused successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to pause subscription',
    });
  }
};

// @desc    Resume subscription
// @route   PUT /api/subscriptions/:id/resume
// @access  Private
export const resumeSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this subscription',
      });
    }

    subscription.status = 'active';
    subscription.pauseReason = undefined;
    subscription.pausedAt = undefined;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription resumed successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resume subscription',
    });
  }
};

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private
export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this subscription',
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel subscription',
    });
  }
};

// @desc    Skip a delivery
// @route   PUT /api/subscriptions/:id/skip
// @access  Private
export const skipDelivery = async (req, res) => {
  try {
    const { date } = req.body;

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this subscription',
      });
    }

    subscription.skippedDates.push(new Date(date));
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Delivery skipped successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Skip delivery error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to skip delivery',
    });
  }
};

// @desc    Get all subscriptions (Admin only)
// @route   GET /api/subscriptions/admin
// @access  Private/Admin
export const getAllSubscriptions = async (req, res) => {
  try {
    const { status, planType } = req.query;

    let query = {};
    if (status) query.status = status;
    if (planType) query.planType = planType;

    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscriptions',
    });
  }
};

// Helper function to calculate total deliveries
function calculateTotalDeliveries(frequency, startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (frequency) {
    case 'every-week':
      return Math.floor(diffDays / 7);
    case 'every-2-weeks':
      return Math.floor(diffDays / 14);
    case 'every-month':
      return Math.floor(diffDays / 30);
    default:
      return 0;
  }
}

// @desc    Process subscription orders (Cron job handler)
// @route   POST /api/subscriptions/process
// @access  Private/Admin
export const processSubscriptionOrders = async (req, res) => {
  try {
    const today = new Date();

    const subscriptions = await Subscription.find({
      status: 'active',
      nextDeliveryDate: { $lte: today },
    });

    let processedCount = 0;

    for (const subscription of subscriptions) {
      // Check if today is a skipped date
      const isSkipped = subscription.skippedDates.some(
        (date) => date.toDateString() === today.toDateString()
      );

      if (!isSkipped) {
        // Create order
        await Order.create({
          user: subscription.user,
          items: subscription.items,
          totalAmount: subscription.totalAmount,
          finalAmount: subscription.totalAmount,
          deliveryAddress: subscription.deliveryAddress,
          deliveryTime: subscription.deliveryTime,
          paymentInfo: {
            method: subscription.paymentMethod === 'cod' ? 'cod' : 'cod',
            status: 'pending',
          },
          isSubscriptionOrder: true,
          subscription: subscription._id,
          orderStatus: 'confirmed',
          tracking: {
            placed: true,
            confirmed: true,
          },
        });

        subscription.completedDeliveries += 1;
        subscription.nextDeliveryDate = calculateNextDelivery(
          subscription.frequency,
          today
        );
        await subscription.save();

        processedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${processedCount} subscription orders`,
      data: { processedCount },
    });
  } catch (error) {
    console.error('Process subscription orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process subscription orders',
    });
  }
};

// Helper function to calculate next delivery date
function calculateNextDelivery(frequency, currentDate) {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'every-week':
      next.setDate(next.getDate() + 7);
      break;
    case 'every-2-weeks':
      next.setDate(next.getDate() + 14);
      break;
    case 'every-month':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}
