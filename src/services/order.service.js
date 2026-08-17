/**
 * Order Service - Order Tracking and Management
 * Handles order queries for the chatbot
 */

import Order from '../models/Order.js';

/**
 * Get latest order for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Latest order or null
 */
export const getLatestOrder = async (userId) => {
  try {
    const order = await Order.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image')
      .limit(1);

    return order;
  } catch (error) {
    console.error('[Order Service] Error getting latest order:', error);
    return null;
  }
};

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID (for validation)
 * @returns {Promise<Object|null>} Order or null
 */
export const getOrderById = async (orderId, userId) => {
  try {
    const query = { _id: orderId };

    // If userId provided, ensure user owns the order
    if (userId) {
      query.user = userId;
    }

    const order = await Order.findOne(query)
      .populate('items.product', 'name image')
      .lean();

    return order;
  } catch (error) {
    console.error('[Order Service] Error getting order by ID:', error);
    return null;
  }
};

/**
 * Get all orders for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max orders to return
 * @returns {Promise<Array>} User's orders
 */
export const getUserOrders = async (userId, limit = 5) => {
  try {
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('items.product', 'name image')
      .lean();

    return orders;
  } catch (error) {
    console.error('[Order Service] Error getting user orders:', error);
    return [];
  }
};

/**
 * Get orders by status
 * @param {string} userId - User ID
 * @param {string} status - Order status
 * @returns {Promise<Array>} Matching orders
 */
export const getOrdersByStatus = async (userId, status) => {
  try {
    const orders = await Order.find({
      user: userId,
      orderStatus: status,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return orders;
  } catch (error) {
    console.error('[Order Service] Error getting orders by status:', error);
    return [];
  }
};

/**
 * Get active orders (not delivered or cancelled)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Active orders
 */
export const getActiveOrders = async (userId) => {
  try {
    const orders = await Order.find({
      user: userId,
      orderStatus: {
        $nin: ['delivered', 'cancelled', 'refunded'],
      },
    })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image')
      .lean();

    return orders;
  } catch (error) {
    console.error('[Order Service] Error getting active orders:', error);
    return [];
  }
};

/**
 * Calculate estimated delivery time
 * @param {Object} order - Order object
 * @returns {string} Estimated delivery time
 */
export const estimateDeliveryTime = (order) => {
  if (!order) return null;

  const status = order.orderStatus;

  // If already delivered
  if (status === 'delivered') {
    return 'Delivered';
  }

  // If cancelled
  if (status === 'cancelled' || status === 'refunded') {
    return 'Order cancelled';
  }

  const createdAt = new Date(order.createdAt);
  const now = new Date();
  const hoursDiff = Math.floor((now - createdAt) / (1000 * 60 * 60));

  // Estimate based on status
  if (status === 'pending' || status === 'confirmed') {
    return '2-4 hours from now';
  }

  if (status === 'processing') {
    return '1-2 hours from now';
  }

  if (status === 'out-for-delivery') {
    return '30-60 minutes from now';
  }

  return 'Today';
};

/**
 * Get order count by status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Order counts
 */
export const getOrderStats = async (userId) => {
  try {
    const orders = await Order.find({ user: userId }).lean();

    const stats = {
      total: orders.length,
      active: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      if (order.orderStatus === 'delivered') {
        stats.delivered++;
      } else if (order.orderStatus === 'cancelled' || order.orderStatus === 'refunded') {
        stats.cancelled++;
      } else {
        stats.active++;
      }
    });

    return stats;
  } catch (error) {
    console.error('[Order Service] Error getting order stats:', error);
    return null;
  }
};

export default {
  getLatestOrder,
  getOrderById,
  getUserOrders,
  getOrdersByStatus,
  getActiveOrders,
  estimateDeliveryTime,
  getOrderStats,
};
