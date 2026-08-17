import express from 'express';
import {
  scanQRCode,
  getQRCode,
  getAllQRCodes,
  deactivateQRCode,
  getQRAnalytics,
} from '../controllers/qrController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public route for scanning
router.get('/scan/:qrCodeString', scanQRCode);

// Analytics must be before /:id to avoid Express matching 'analytics' as an id
router.get('/analytics', protect, admin, getQRAnalytics);

// Protected admin routes
router.get('/', protect, admin, getAllQRCodes);
router.get('/:id', protect, admin, getQRCode);
router.put('/:id/deactivate', protect, admin, deactivateQRCode);

export default router;
