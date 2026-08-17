import mongoose from 'mongoose';

// Set environment variables for serverless (these come from Vercel Environment Variables dashboard)
// dotenv is not needed on Vercel — env vars are injected automatically

// Import the shared Express app and DB connector
import app from '../backend/src/app.js';
import connectDB from '../backend/src/config/db.js';

// Reuse MongoDB connection across warm serverless invocations
let isConnected = false;

const ensureDbConnected = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error in serverless:', error.message);
    isConnected = false;
    throw error;
  }
};

// Vercel Serverless handler — wraps Express app
export default async function handler(req, res) {
  try {
    await ensureDbConnected();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please check MongoDB Atlas configuration.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
  // Delegate to Express
  return app(req, res);
}
