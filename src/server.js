import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables FIRST before any other imports that need them
dotenv.config();

import connectDB from './config/db.js';
import app from './app.js';

// Connect to database
connectDB();

// Security middleware (only for standalone server, not serverless)
app.use(helmet());

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CluckFresh Hub API',
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

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🐔 CluckFresh Hub API Server                            ║
║                                                           ║
║   🚀 Server running on port ${PORT}                       ║
║   📍 Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   🗄️  Database: Connected                                 ║
║   🤖 AI Chatbot: OpenAI + Ollama (fallback)               ║
║   💳 Razorpay: Ready                                      ║
║                                                           ║
║   API Endpoints:                                          ║
║   • Auth: /api/auth                                       ║
║   • Products: /api/products                               ║
║   • Orders: /api/orders                                   ║
║   • Subscriptions: /api/subscriptions                     ║
║   • AI Chat: /api/ai/chat                                 ║
║   • AI Recipes: /api/ai/chat/recipe                       ║
║   • QR Codes: /api/qr                                     ║
║   • Dashboard: /api/dashboard                             ║
║   • Chat: /api/chat                                       ║
║   • Utils: /api/utils                                     ║
║   • Payment: /api/payment                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle server errors (e.g., port already in use)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Please free the port or use a different one.`);
    console.error(`   Run: npx kill-port ${PORT}  (or use the free-port script)\n`);
  } else {
    console.error(`❌ Server error: ${err.message}`);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  server.close(() => process.exit(1));
});

export default app;
