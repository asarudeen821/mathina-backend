import express from 'express';
import googleMapsService from '../utils/googleMapsService.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get delivery estimate
// @route   POST /api/delivery/estimate
// @access  Public
router.post('/estimate', async (req, res) => {
  try {
    const { pickupAddress, deliveryAddress, weather } = req.body;

    if (!pickupAddress || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and delivery addresses are required',
      });
    }

    const estimate = await googleMapsService.getDeliveryEstimate(
      pickupAddress,
      deliveryAddress,
      weather
    );

    res.status(200).json({
      success: true,
      data: estimate,
    });
  } catch (error) {
    console.error('Delivery estimate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate delivery estimate',
    });
  }
});

// @desc    Check if address is deliverable
// @route   POST /api/delivery/check
// @access  Public
router.post('/check', async (req, res) => {
  try {
    const { address, deliveryZones } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required',
      });
    }

    const isDeliverable = await googleMapsService.isDeliverable(address, deliveryZones);

    res.status(200).json({
      success: true,
      data: {
        isDeliverable,
        message: isDeliverable 
          ? 'Address is within our delivery zone' 
          : 'Sorry, we do not deliver to this area yet',
      },
    });
  } catch (error) {
    console.error('Delivery check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check delivery',
    });
  }
});

// @desc    Optimize delivery route (Admin only)
// @route   POST /api/delivery/optimize
// @access  Private/Admin
router.post('/optimize', protect, admin, async (req, res) => {
  try {
    const { startLocation, stops } = req.body;

    if (!startLocation || !stops || stops.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Start location and stops are required',
      });
    }

    const route = await googleMapsService.optimizeRoute(startLocation, stops);

    res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize route',
    });
  }
});

// @desc    Geocode address
// @route   POST /api/delivery/geocode
// @access  Private
router.post('/geocode', protect, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required',
      });
    }

    const result = await googleMapsService.geocodeAddress(address);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to geocode address',
    });
  }
});

// @desc    Test Google Maps connection (Admin only)
// @route   GET /api/delivery/test
// @access  Private/Admin
router.get('/test', protect, admin, async (req, res) => {
  try {
    const isConnected = await googleMapsService.testConnection();

    res.status(200).json({
      success: true,
      data: {
        connected: isConnected,
        configured: googleMapsService.isConfigured,
      },
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed',
    });
  }
});

export default router;
