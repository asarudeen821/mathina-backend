/**
 * Cart Service - Cart Management for Chatbot Integration
 * Handles add to cart, update, and cart operations
 */

import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Add item to cart
 * @param {string} userId - User ID
 * @param {Object} itemData - Item data
 * @returns {Promise<Object>} Updated cart
 */
export const addToCart = async (userId, itemData) => {
  try {
    const { productId, quantity = 1, weight = null } = itemData;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check stock
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (!weight || (item.weight && item.weight === weight))
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        name: product.name,
        quantity,
        weight,
        price: weight
          ? product.weightOptions?.find((w) => w.weight === weight)?.price || product.price
          : product.price,
        image: product.images?.[0]?.url,
        category: product.category,
      });
    }

    await cart.save();

    return cart;
  } catch (error) {
    console.error('[Cart Service] Error adding to cart:', error);
    throw error;
  }
};

/**
 * Add item to cart by product name (fuzzy match)
 * @param {string} userId - User ID
 * @param {string} productName - Product name (partial match)
 * @param {number} quantity - Quantity
 * @returns {Promise<Object>} Result with success status
 */
export const addToCartByName = async (userId, productName, quantity = 1) => {
  try {
    // Find product by name (case insensitive regex)
    const product = await Product.findOne({
      name: { $regex: productName, $options: 'i' },
      isAvailable: true,
    });

    if (!product) {
      return {
        success: false,
        message: `Product "${productName}" not found`,
        cart: null,
      };
    }

    // Add to cart
    const cart = await addToCart(userId, {
      productId: product._id,
      quantity,
    });

    return {
      success: true,
      message: `${product.name} added to cart`,
      cart,
      product,
    };
  } catch (error) {
    console.error('[Cart Service] Error adding to cart by name:', error);
    return {
      success: false,
      message: error.message || 'Failed to add to cart',
      cart: null,
    };
  }
};

/**
 * Get user's cart
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Cart or null
 */
export const getCart = async (userId) => {
  try {
    const cart = await Cart.findOne({ user: userId }).populate(
      'items.product',
      'name price category images'
    );

    return cart;
  } catch (error) {
    console.error('[Cart Service] Error getting cart:', error);
    return null;
  }
};

/**
 * Get cart summary
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Cart summary
 */
export const getCartSummary = async (userId) => {
  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return null;
    }

    return {
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: cart.totalAmount,
      deliveryFee: cart.deliveryFee,
      finalAmount: cart.finalAmount,
      isFreeDelivery: cart.deliveryFee === 0,
    };
  } catch (error) {
    console.error('[Cart Service] Error getting cart summary:', error);
    return null;
  }
};

/**
 * Update item quantity in cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 * @param {number} weight - Weight option
 * @returns {Promise<Object|null>} Updated cart
 */
export const updateCartQuantity = async (userId, productId, quantity, weight = null) => {
  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return null;
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (!weight || (item.weight && item.weight === weight))
    );

    if (itemIndex === -1) {
      return null;
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    return cart;
  } catch (error) {
    console.error('[Cart Service] Error updating quantity:', error);
    return null;
  }
};

/**
 * Remove item from cart
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {number} weight - Weight option
 * @returns {Promise<Object|null>} Updated cart
 */
export const removeFromCart = async (userId, productId, weight = null) => {
  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return null;
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          (!weight || (item.weight && item.weight === weight))
        )
    );

    await cart.save();

    return cart;
  } catch (error) {
    console.error('[Cart Service] Error removing from cart:', error);
    return null;
  }
};

/**
 * Clear cart
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Cleared cart
 */
export const clearCart = async (userId) => {
  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return null;
    }

    cart.items = [];
    await cart.save();

    return cart;
  } catch (error) {
    console.error('[Cart Service] Error clearing cart:', error);
    return null;
  }
};

/**
 * Detect product intent from message and suggest add to cart
 * @param {string} message - User message
 * @param {Array} products - Available products
 * @returns {Object} Product match result
 */
export const detectProductForCart = (message, products = []) => {
  if (!message || products.length === 0) {
    return { found: false, product: null };
  }

  const text = message.toLowerCase();

  // Search for product match
  const matchedProduct = products.find((product) => {
    const nameMatch = product.name.toLowerCase().includes(text);
    const categoryMatch = product.category.toLowerCase().includes(text);
    return nameMatch || categoryMatch;
  });

  if (matchedProduct) {
    return {
      found: true,
      product: matchedProduct,
      message: `Would you like to add ${matchedProduct.name} to your cart?`,
    };
  }

  return { found: false, product: null };
};

export default {
  addToCart,
  addToCartByName,
  getCart,
  getCartSummary,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  detectProductForCart,
};
