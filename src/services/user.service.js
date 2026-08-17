/**
 * User Service - User Preferences and Personalization
 * Handles user data for personalized recommendations
 */

import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User preferences or null
 */
export const getUserPreferences = async (userId) => {
  try {
    const user = await User.findById(userId).select('preferences name').lean();

    if (!user) {
      return null;
    }

    return {
      name: user.name,
      language: user.preferences?.language || 'english',
      dietaryPreferences: user.preferences?.dietaryPreferences || [],
    };
  } catch (error) {
    console.error('[User Service] Error getting preferences:', error);
    return null;
  }
};

/**
 * Get user's frequently ordered products
 * @param {string} userId - User ID
 * @param {number} limit - Max products to return
 * @returns {Promise<Array>} Frequent products with counts
 */
export const getFrequentOrders = async (userId, limit = 5) => {
  try {
    const orders = await Order.find({ user: userId })
      .select('items orderStatus')
      .lean();

    if (!orders || orders.length === 0) {
      return [];
    }

    // Count product occurrences
    const productCounts = {};

    orders.forEach((order) => {
      // Only count delivered orders for preferences
      if (order.orderStatus !== 'delivered') return;

      order.items.forEach((item) => {
        const productName = item.name || item.product?.name || 'Unknown';
        const key = productName.toLowerCase();

        if (!productCounts[key]) {
          productCounts[key] = {
            name: productName,
            count: 0,
            lastOrdered: null,
          };
        }

        productCounts[key].count += item.quantity;
        productCounts[key].lastOrdered = order.createdAt;
      });
    });

    // Convert to array and sort by count
    const frequentProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return frequentProducts;
  } catch (error) {
    console.error('[User Service] Error getting frequent orders:', error);
    return [];
  }
};

/**
 * Get user's favorite categories
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Favorite categories
 */
export const getFavoriteCategories = async (userId) => {
  try {
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'category')
      .select('items orderStatus')
      .lean();

    if (!orders || orders.length === 0) {
      return [];
    }

    const categoryCounts = {};

    orders.forEach((order) => {
      if (order.orderStatus !== 'delivered') return;

      order.items.forEach((item) => {
        const category = item.product?.category || 'other';

        if (!categoryCounts[category]) {
          categoryCounts[category] = 0;
        }

        categoryCounts[category]++;
      });
    });

    // Convert to array and sort
    const favorites = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return favorites;
  } catch (error) {
    console.error('[User Service] Error getting favorite categories:', error);
    return [];
  }
};

/**
 * Get personalized product recommendations
 * @param {string} userId - User ID
 * @param {Array} availableProducts - Available products
 * @returns {Promise<Array>} Recommended products
 */
export const getPersonalizedRecommendations = async (userId, availableProducts = []) => {
  try {
    // Get user's order history
    const frequentOrders = await getFrequentOrders(userId, 10);
    const favoriteCategories = await getFavoriteCategories(userId);

    if (frequentOrders.length === 0 && favoriteCategories.length === 0) {
      // No history, return featured products
      return availableProducts.filter((p) => p.isFeatured).slice(0, 5);
    }

    // Score products based on user preferences
    const scoredProducts = availableProducts.map((product) => {
      let score = 0;

      // Check if matches frequent orders
      const frequentMatch = frequentOrders.find(
        (fo) => fo.name.toLowerCase().includes(product.name.toLowerCase())
      );
      if (frequentMatch) {
        score += frequentMatch.count * 10;
      }

      // Check if matches favorite category
      const categoryMatch = favoriteCategories.find(
        (fc) => fc.category === product.category
      );
      if (categoryMatch) {
        score += categoryMatch.count * 5;
      }

      // Boost featured products
      if (product.isFeatured) {
        score += 3;
      }

      return { ...product, score };
    });

    // Sort by score and return top 5
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } catch (error) {
    console.error('[User Service] Error getting recommendations:', error);
    return availableProducts.slice(0, 5);
  }
};

/**
 * Get user reorder suggestions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Products to reorder
 */
export const getReorderSuggestions = async (userId) => {
  try {
    const frequentOrders = await getFrequentOrders(userId, 5);

    if (frequentOrders.length === 0) {
      return [];
    }

    return frequentOrders.map((item) => ({
      name: item.name,
      count: item.count,
      lastOrdered: item.lastOrdered,
      suggestion: `You've ordered this ${item.count} times`,
    }));
  } catch (error) {
    console.error('[User Service] Error getting reorder suggestions:', error);
    return [];
  }
};

/**
 * Build personalization context for AI
 * @param {string} userId - User ID
 * @returns {Promise<string>} Personalization context string
 */
export const buildPersonalizationContext = async (userId) => {
  try {
    const preferences = await getUserPreferences(userId);
    const frequentOrders = await getFrequentOrders(userId, 3);
    const favoriteCategories = await getFavoriteCategories(userId);

    if (!preferences) {
      return '';
    }

    let context = `User Profile:\n`;
    context += `- Name: ${preferences.name}\n`;
    context += `- Language: ${preferences.language}\n`;

    if (frequentOrders.length > 0) {
      context += `- Frequently orders: ${frequentOrders.map((fo) => fo.name).join(', ')}\n`;
    }

    if (favoriteCategories.length > 0) {
      context += `- Favorite categories: ${favoriteCategories.map((fc) => fc.category).join(', ')}\n`;
    }

    if (preferences.dietaryPreferences?.length > 0) {
      context += `- Dietary preferences: ${preferences.dietaryPreferences.join(', ')}\n`;
    }

    return context;
  } catch (error) {
    console.error('[User Service] Error building context:', error);
    return '';
  }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} updates - Preference updates
 * @returns {Promise<Object|null>} Updated preferences
 */
export const updateUserPreferences = async (userId, updates) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'preferences.language': updates.language,
          'preferences.dietaryPreferences': updates.dietaryPreferences,
        },
      },
      { new: true, select: 'preferences' }
    );

    if (!user) {
      return null;
    }

    return {
      language: user.preferences?.language || 'english',
      dietaryPreferences: user.preferences?.dietaryPreferences || [],
    };
  } catch (error) {
    console.error('[User Service] Error updating preferences:', error);
    return null;
  }
};

export default {
  getUserPreferences,
  getFrequentOrders,
  getFavoriteCategories,
  getPersonalizedRecommendations,
  getReorderSuggestions,
  buildPersonalizationContext,
  updateUserPreferences,
};
