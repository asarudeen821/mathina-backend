import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// @desc    Get AI-powered dashboard insights
// @route   GET /api/dashboard/ai-insights
// @access  Private/Admin
export const getAIInsights = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    // Calculate date range
    const startDate = new Date();
    if (period === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 7);

    // Gather dashboard data
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({ isAvailable: true });
    const totalOrders = await Order.countDocuments();
    
    const ordersInPeriod = await Order.countDocuments({
      createdAt: { $gte: startDate },
    });

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
    }).limit(5);

    // Top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: '$items.product',
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.price' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ]);

    // Customer analytics
    const newCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startDate },
    });

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

    // Prepare data for AI analysis
    const dashboardData = {
      period,
      metrics: {
        totalRevenue,
        totalOrders,
        ordersInPeriod,
        totalCustomers: totalUsers,
        newCustomers,
        repeatCustomers: repeatCustomers[0]?.count || 0,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topProducts: topProducts.map(p => ({
        name: p.product.name,
        orders: p.orderCount,
        revenue: p.revenue,
      })),
      lowStockProducts: lowStockProducts.map(p => ({
        name: p.name,
        stock: p.stock,
      })),
    };

    // Generate AI insights using Gemini
    let aiInsights = null;
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
Analyze this e-commerce dashboard data for a fresh chicken delivery business and provide actionable insights:

**Business Data (Last ${period}):**
- Revenue: ₹${totalRevenue.toLocaleString()}
- Total Orders: ${ordersInPeriod}
- Total Customers: ${totalUsers}
- New Customers: ${newCustomers}
- Repeat Customers: ${repeatCustomers[0]?.count || 0}
- Products: ${totalProducts}
- Low Stock Items: ${lowStockProducts.length}

**Orders by Status:**
${Object.entries(dashboardData.ordersByStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

**Top 5 Products:**
${dashboardData.topProducts.map(p => `- ${p.name}: ${p.orders} orders, ₹${p.revenue} revenue`).join('\n')}

**Low Stock Alerts:**
${dashboardData.lowStockProducts.length > 0 ? dashboardData.lowStockProducts.map(p => `- ${p.name}: Only ${p.stock} left`).join('\n') : '- No low stock items'}

Provide a concise analysis with:
1. **Key Highlights** (2-3 positive points)
2. **Areas of Concern** (2-3 issues to address)
3. **Actionable Recommendations** (3-5 specific actions)
4. **Growth Opportunities** (2-3 opportunities)

Format the response in a clear, business-friendly manner. Be specific and actionable.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiInsights = response.text();
      }
    } catch (aiError) {
      console.error('AI insights generation error:', aiError.message);
      // Continue without AI insights if API fails
      aiInsights = null;
    }

    // Generate basic insights if AI is not available
    if (!aiInsights) {
      aiInsights = generateBasicInsights(dashboardData);
    }

    res.status(200).json({
      success: true,
      data: {
        dashboardData,
        aiInsights,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI insights',
    });
  }
};

// Fallback basic insights generator (when AI is not available)
const generateBasicInsights = (data) => {
  const insights = [];

  // Revenue insights
  if (data.metrics.totalRevenue > 0) {
    insights.push(`💰 **Revenue:** Generated ₹${data.metrics.totalRevenue.toLocaleString()} in revenue during this period.`);
  }

  // Order insights
  const avgOrderValue = data.metrics.totalOrders > 0 
    ? (data.metrics.totalRevenue / data.metrics.ordersInPeriod).toFixed(0) 
    : 0;
  insights.push(`📦 **Orders:** Received ${data.metrics.ordersInPeriod} orders with an average order value of ₹${avgOrderValue}.`);

  // Customer insights
  if (data.metrics.newCustomers > 0) {
    insights.push(`👥 **Customers:** Acquired ${data.metrics.newCustomers} new customers.`);
  }
  
  if (data.metrics.repeatCustomers > 0) {
    const retentionRate = ((data.metrics.repeatCustomers / data.metrics.totalCustomers) * 100).toFixed(1);
    insights.push(`⭐ **Loyalty:** Have ${data.metrics.repeatCustomers} repeat customers (${retentionRate}% retention rate).`);
  }

  // Low stock alerts
  if (data.lowStockProducts.length > 0) {
    insights.push(`⚠️ **Stock Alert:** ${data.lowStockProducts.length} products are running low on stock. Consider restocking soon.`);
  }

  // Top product
  if (data.topProducts.length > 0) {
    insights.push(`🏆 **Best Seller:** ${data.topProducts[0].name} is your top product with ${data.topProducts[0].orders} orders.`);
  }

  // Recommendations
  insights.push('\n**Recommendations:**');
  insights.push('1. Monitor low stock items and restock promptly');
  insights.push('2. Focus on customer retention strategies');
  insights.push('3. Promote top-selling products');
  insights.push('4. Analyze order patterns for inventory optimization');

  return insights.join('\n\n');
};

// @desc    Get AI product recommendations
// @route   GET /api/dashboard/ai-product-insights
// @access  Private/Admin
export const getProductInsights = async (req, res) => {
  try {
    // Get product data
    const products = await Product.find({ isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(20);

    const orders = await Order.find({
      orderStatus: { $nin: ['cancelled', 'refunded'] },
    })
      .sort({ createdAt: -1 })
      .limit(100);

    // Analyze product performance
    const productPerformance = products.map(product => {
      const productOrders = orders.filter(order =>
        order.items.some(item => item.product.toString() === product._id.toString())
      );

      return {
        productId: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        orderCount: productOrders.length,
        totalRevenue: productOrders.reduce((sum, order) => {
          const item = order.items.find(i => i.product.toString() === product._id.toString());
          return sum + (item ? item.price * item.quantity : 0);
        }, 0),
      };
    });

    // Sort by performance
    productPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Generate insights
    const topPerformers = productPerformance.slice(0, 3);
    const underPerformers = productPerformance.filter(p => p.orderCount === 0).slice(0, 3);
    const lowStock = productPerformance.filter(p => p.stock < 10);

    let aiRecommendations = null;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
Analyze these product performance metrics for a chicken e-commerce store and provide recommendations:

**Top 3 Products:**
${topPerformers.map(p => `- ${p.name}: ${p.orderCount} orders, ₹${p.totalRevenue} revenue, Stock: ${p.stock}`).join('\n')}

**Underperforming Products (No Orders):**
${underPerformers.length > 0 ? underPerformers.map(p => `- ${p.name} (Category: ${p.category}), Price: ₹${p.price}, Stock: ${p.stock}`).join('\n') : '- None'}

**Low Stock Products:**
${lowStock.length > 0 ? lowStock.map(p => `- ${p.name}: Only ${p.stock} units left`).join('\n') : '- None'}

Provide specific recommendations for:
1. **Inventory Management** (stocking decisions)
2. **Pricing Strategy** (price adjustments)
3. **Marketing Focus** (which products to promote)
4. **Product Optimization** (improvements needed)

Be concise and actionable.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiRecommendations = response.text();
      }
    } catch (aiError) {
      console.error('AI product insights error:', aiError.message);
      aiRecommendations = null;
    }

    if (!aiRecommendations) {
      aiRecommendations = 'Review product performance regularly. Focus on promoting top performers and consider discounts for underperforming items. Monitor stock levels closely.';
    }

    res.status(200).json({
      success: true,
      data: {
        productPerformance,
        topPerformers,
        underPerformers,
        lowStock,
        aiRecommendations,
      },
    });
  } catch (error) {
    console.error('Get product insights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate product insights',
    });
  }
};
