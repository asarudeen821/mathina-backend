import QRCode from '../models/QRCode.js';
import Product from '../models/Product.js';

// @desc    Scan QR code and get traceability info
// @route   GET /api/qr/scan/:qrCodeString
// @access  Public
export const scanQRCode = async (req, res) => {
  try {
    const { qrCodeString } = req.params;

    const qrCodeRecord = await QRCode.findOne({ qrCodeString })
      .populate('product', 'name images category price farmOrigin')
      .populate('lastScannedBy', 'name');

    if (!qrCodeRecord || !qrCodeRecord.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive QR code',
      });
    }

    // Update scan count
    qrCodeRecord.scanCount += 1;
    qrCodeRecord.lastScannedAt = new Date();

    // If user is authenticated, track who scanned
    if (req.user) {
      qrCodeRecord.lastScannedBy = req.user._id;
    }

    await qrCodeRecord.save();

    res.status(200).json({
      success: true,
      data: {
        product: qrCodeRecord.product,
        traceabilityData: qrCodeRecord.traceabilityData,
        scanCount: qrCodeRecord.scanCount,
        firstScannedAt: qrCodeRecord.createdAt,
        lastScannedAt: qrCodeRecord.lastScannedAt,
      },
    });
  } catch (error) {
    console.error('Scan QR code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scan QR code',
    });
  }
};

// @desc    Get QR code details (Admin only)
// @route   GET /api/qr/:id
// @access  Private/Admin
export const getQRCode = async (req, res) => {
  try {
    const qrCodeRecord = await QRCode.findById(req.params.id)
      .populate('product', 'name category')
      .populate('lastScannedBy', 'name email');

    if (!qrCodeRecord) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found',
      });
    }

    res.status(200).json({
      success: true,
      data: qrCodeRecord,
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch QR code',
    });
  }
};

// @desc    Get all QR codes (Admin only)
// @route   GET /api/qr
// @access  Private/Admin
export const getAllQRCodes = async (req, res) => {
  try {
    const { isActive, product } = req.query;

    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (product) query.product = product;

    const qrCodes = await QRCode.find(query)
      .populate('product', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: qrCodes.length,
      data: qrCodes,
    });
  } catch (error) {
    console.error('Get all QR codes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch QR codes',
    });
  }
};

// @desc    Deactivate QR code (Admin only)
// @route   PUT /api/qr/:id/deactivate
// @access  Private/Admin
export const deactivateQRCode = async (req, res) => {
  try {
    const qrCodeRecord = await QRCode.findById(req.params.id);

    if (!qrCodeRecord) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found',
      });
    }

    qrCodeRecord.isActive = false;
    await qrCodeRecord.save();

    res.status(200).json({
      success: true,
      message: 'QR code deactivated successfully',
      data: qrCodeRecord,
    });
  } catch (error) {
    console.error('Deactivate QR code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate QR code',
    });
  }
};

// @desc    Get QR code analytics (Admin only)
// @route   GET /api/qr/analytics
// @access  Private/Admin
export const getQRAnalytics = async (req, res) => {
  try {
    const totalQRCodes = await QRCode.countDocuments();
    const activeQRCodes = await QRCode.countDocuments({ isActive: true });
    const totalScans = await QRCode.aggregate([
      { $group: { _id: null, total: { $sum: '$scanCount' } } },
    ]);

    const topScannedProducts = await QRCode.aggregate([
      { $match: { isActive: true } },
      { $sort: { scanCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          scanCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalQRCodes,
        activeQRCodes,
        totalScans: totalScans[0]?.total || 0,
        topScannedProducts,
      },
    });
  } catch (error) {
    console.error('Get QR analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch QR analytics',
    });
  }
};
