import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import geminiService from '../utils/geminiService.js';

// @desc    Get dashboard statistics (Admin only)
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    // Calculate date range
    const startDate = new Date();
    if (period === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 7);

    // Total users
    const totalUsers = await User.countDocuments({ role: 'customer' });

    // Total products
    const totalProducts = await Product.countDocuments({ isAvailable: true });

    // Total orders
    const totalOrders = await Order.countDocuments();

    // Orders in period
    const ordersInPeriod = await Order.countDocuments({
      createdAt: { $gte: startDate },
    });

    // Revenue
    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      stock: { $lte: 10 },
      isAvailable: true,
    }).limit(10);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    // Active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      status: 'active',
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          ordersInPeriod,
          totalRevenue,
          activeSubscriptions,
        },
        ordersByStatus,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard stats',
    });
  }
};

// @desc    Get revenue analytics (Admin only)
// @route   GET /api/dashboard/revenue
// @access  Private/Admin
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    const startDate = new Date();
    if (period === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);
    else if (period === '1year') startDate.setFullYear(startDate.getFullYear() - 1);

    // Daily revenue
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Category-wise revenue
    const categoryRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: '$items.price' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Monthly revenue trend (for line/area chart)
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Revenue by payment method (for pie chart)
    const revenueByPayment = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$finalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Weekly revenue comparison (for bar chart)
    const weeklyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: {
            week: { $dayOfWeek: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          revenue: { $sum: '$finalAmount' },
        },
      },
      { $sort: { '_id.week': 1 } },
    ]);

    // Stacked data: Category revenue over time (for stacked bar chart)
    const stackedCategoryRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            category: '$product.category',
          },
          revenue: { $sum: '$items.price' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Order status distribution (for pie/donut chart)
    const orderStatusDistribution = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyRevenue,
        categoryRevenue,
        monthlyRevenue,
        revenueByPayment,
        weeklyRevenue,
        stackedCategoryRevenue,
        orderStatusDistribution,
      },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch revenue analytics',
    });
  }
};

// @desc    Get customer analytics (Admin only)
// @route   GET /api/dashboard/customers
// @access  Private/Admin
export const getCustomerAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    const startDate = new Date();
    if (period === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);
    else if (period === '1year') startDate.setFullYear(startDate.getFullYear() - 1);

    // New customers in period
    const newCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startDate },
    });

    // Top customers by order value
    const topCustomers = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$finalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          phone: '$user.phone',
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]);

    // Customer retention rate
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const repeatCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
        },
      },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'count' },
    ]);

    const retentionRate =
      totalCustomers > 0
        ? ((repeatCustomers[0]?.count || 0) / totalCustomers) * 100
        : 0;

    // Daily customer registration trend
    const dailyCustomerTrend = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Customer orders by status (for pie chart)
    const customerOrderStatus = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly customer growth (for line/area chart)
    const monthlyCustomerGrowth = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Customer location distribution (assuming deliveryAddress has city)
    const customerLocation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          deliveryAddress: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$deliveryAddress.city',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Average order value per customer segment
    const customerSegments = await User.aggregate([
      {
        $match: { role: 'customer' },
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders',
        },
      },
      {
        $addFields: {
          totalSpent: { $sum: '$orders.finalAmount' },
          orderCount: { $size: '$orders' },
        },
      },
      {
        $addFields: {
          segment: {
            $cond: [
              { $gte: ['$totalSpent', 5000] },
              'Premium',
              { $cond: [{ $gte: ['$totalSpent', 2000] }, 'Regular', 'New'] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 },
          avgSpent: { $avg: '$totalSpent' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        newCustomers,
        totalCustomers,
        repeatCustomers: repeatCustomers[0]?.count || 0,
        retentionRate: retentionRate.toFixed(2),
        topCustomers,
        dailyCustomerTrend,
        customerOrderStatus,
        monthlyCustomerGrowth,
        customerLocation,
        customerSegments,
      },
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customer analytics',
    });
  }
};

// @desc    Get AI business insights (Admin only)
// @route   GET /api/dashboard/ai-insights
// @access  Private/Admin
export const getAIInsights = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    const startDate = new Date();
    if (period === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);

    const [totalRevenue, ordersInPeriod, totalCustomers, totalProducts, topProducts, lowStockProducts] =
      await Promise.all([
        Order.aggregate([
          { $match: { createdAt: { $gte: startDate }, orderStatus: { $nin: ['cancelled', 'refunded'] } } },
          { $group: { _id: null, total: { $sum: '$finalAmount' } } },
        ]),
        Order.countDocuments({ createdAt: { $gte: startDate } }),
        User.countDocuments({ role: 'customer' }),
        Product.countDocuments({ isAvailable: true }),
        Order.aggregate([
          { $match: { createdAt: { $gte: startDate }, orderStatus: { $nin: ['cancelled', 'refunded'] } } },
          { $unwind: '$items' },
          { $group: { _id: '$items.name', orders: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
          { $project: { name: '$_id', orders: 1, revenue: 1, _id: 0 } },
        ]),
        Product.find({ stock: { $lte: 10 }, isAvailable: true }).select('name stock').limit(5).lean(),
      ]);

    const metrics = {
      totalRevenue: totalRevenue[0]?.total || 0,
      ordersInPeriod,
      totalCustomers,
      totalProducts,
    };

    // Build AI prompt
    const prompt = `You are a business analyst for Mathina FreshHub, a chicken shop in Cuddalore, Tamil Nadu.

Business data for the last ${period}:
- Revenue: ₹${metrics.totalRevenue.toLocaleString()}
- Orders: ${metrics.ordersInPeriod}
- Total Customers: ${metrics.totalCustomers}
- Products Available: ${metrics.totalProducts}
- Top Products: ${topProducts.map(p => `${p.name} (${p.orders} orders, ₹${p.revenue})`).join(', ') || 'No data'}
- Low Stock Items: ${lowStockProducts.map(p => `${p.name} (${p.stock} left)`).join(', ') || 'None'}

Provide 3-4 concise business insights and actionable recommendations in 150 words or less. Focus on revenue growth, stock management, and customer retention. Be specific to a local chicken shop context.`;

    let aiInsights = 'AI insights unavailable. Please configure Gemini API key.';
    try {
      aiInsights = await geminiService.chat(prompt);
    } catch (aiError) {
      console.warn('Gemini AI insights failed:', aiError.message);
      aiInsights = `Business Summary: ₹${metrics.totalRevenue.toLocaleString()} revenue from ${metrics.ordersInPeriod} orders this period. ${lowStockProducts.length > 0 ? `Restock needed: ${lowStockProducts.map(p => p.name).join(', ')}.` : 'Stock levels are healthy.'} Focus on repeat customer engagement to grow revenue.`;
    }

    res.status(200).json({
      success: true,
      data: {
        dashboardData: { metrics, topProducts, lowStockProducts },
        aiInsights,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch AI insights' });
  }
};

// @desc    Get product insights (Admin only)
// @route   GET /api/dashboard/products
// @access  Private/Admin
export const getProductInsights = async (req, res) => {
  try {
    // Best selling products
    const bestSelling = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.price' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          price: '$product.price',
          quantitySold: 1,
          revenue: 1,
        },
      },
    ]);

    // Low stock alert
    const lowStock = await Product.find({
      stock: { $lte: 10 },
      isAvailable: true,
    })
      .sort({ stock: 1 })
      .limit(10);

    // Out of stock
    const outOfStock = await Product.find({
      stock: 0,
      isAvailable: true,
    });

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      { $match: { isAvailable: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        bestSelling,
        lowStock,
        outOfStock,
        categoryDistribution,
      },
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product analytics',
    });
  }
};
