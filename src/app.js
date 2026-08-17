import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './middleware/error.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import qrRoutes from './routes/qrRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import utilsRoutes from './routes/utilsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import priceScheduleRoutes from './routes/priceScheduleRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import aiDashboardRoutes from './routes/aiDashboardRoutes.js';
import hierarchicalPricingRoutes from './routes/hierarchicalPricingRoutes.js';

// Create and configure Express app (no listen — used by both server.js and Vercel serverless)
const app = express();

// CORS configuration — allow Vercel frontend + local dev
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, same-origin serverless)
      if (!origin) return callback(null, true);
      const allowed = new Set([
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'https://mathina-online-devilery.vercel.app',
      ]);
      // Allow the exact origin or any *.vercel.app preview deployments
      if (allowed.has(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mathina FreshHub API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/price-schedules', priceScheduleRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/dashboard/ai', aiDashboardRoutes);
app.use('/api/hierarchical-pricing', hierarchicalPricingRoutes);

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Mathina FreshHub API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      subscriptions: '/api/subscriptions',
      ai: '/api/ai',
      qr: '/api/qr',
      dashboard: '/api/dashboard',
      chat: '/api/chat',
      utils: '/api/utils',
      payment: '/api/payment',
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
