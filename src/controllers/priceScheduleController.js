import PriceSchedule from '../models/PriceSchedule.js';
import Product from '../models/Product.js';

// @desc    Create price schedule
// @route   POST /api/price-schedules
// @access  Private/Admin
export const createPriceSchedule = async (req, res) => {
  try {
    const { productId, effectiveDate, pricePerKg, notes, reason } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Validate date is not in the past
    const scheduleDate = new Date(effectiveDate);
    scheduleDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule price for past dates',
      });
    }

    // Check if schedule already exists for this date
    const existingSchedule = await PriceSchedule.findOne({
      product: productId,
      effectiveDate: {
        $gte: scheduleDate,
        $lt: new Date(scheduleDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Price schedule already exists for this date. Please update the existing schedule.',
      });
    }

    // Calculate weight options
    const KG_OPTIONS = [0.5, 1, 1.5, 2, 3];
    const weightOptions = KG_OPTIONS.map((kg) => ({
      weight: kg * 1000,
      price: Math.round(pricePerKg * kg),
    }));

    // Create schedule
    const schedule = await PriceSchedule.create({
      product: productId,
      effectiveDate: scheduleDate,
      pricePerKg,
      weightOptions,
      createdBy: req.user._id,
      notes,
      reason: reason || 'market-rate',
      status: 'scheduled',
    });

    // If schedule is for today, apply it immediately
    if (scheduleDate.getTime() === today.getTime()) {
      await applySchedule(schedule._id);
    }

    res.status(201).json({
      success: true,
      message: 'Price schedule created successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Create price schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create price schedule',
    });
  }
};

// @desc    Get all price schedules
// @route   GET /api/price-schedules
// @access  Private/Admin
export const getPriceSchedules = async (req, res) => {
  try {
    const { productId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    let query = {};

    if (productId) query.product = productId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.effectiveDate = {};
      if (startDate) query.effectiveDate.$gte = new Date(startDate);
      if (endDate) query.effectiveDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const schedules = await PriceSchedule.find(query)
      .populate('product', 'name category images')
      .populate('createdBy', 'name email')
      .sort({ effectiveDate: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await PriceSchedule.countDocuments(query);

    res.status(200).json({
      success: true,
      count: schedules.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: schedules,
    });
  } catch (error) {
    console.error('Get price schedules error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch price schedules',
    });
  }
};

// @desc    Get price schedule by ID
// @route   GET /api/price-schedules/:id
// @access  Private/Admin
export const getPriceSchedule = async (req, res) => {
  try {
    const schedule = await PriceSchedule.findById(req.params.id)
      .populate('product', 'name category price images')
      .populate('createdBy', 'name email');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Price schedule not found',
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Get price schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch price schedule',
    });
  }
};

// @desc    Get schedules for a product
// @route   GET /api/price-schedules/product/:productId
// @access  Private/Admin
export const getProductSchedules = async (req, res) => {
  try {
    const { productId } = req.params;
    const { includeExpired = false } = req.query;

    let query = { product: productId };
    
    if (!includeExpired) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.effectiveDate = { $gte: today };
    }

    const schedules = await PriceSchedule.find(query)
      .populate('createdBy', 'name')
      .sort({ effectiveDate: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error('Get product schedules error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product schedules',
    });
  }
};

// @desc    Update price schedule
// @route   PUT /api/price-schedules/:id
// @access  Private/Admin
export const updatePriceSchedule = async (req, res) => {
  try {
    let schedule = await PriceSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Price schedule not found',
      });
    }

    // Don't allow updating expired schedules
    if (schedule.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update expired schedule',
      });
    }

    const { pricePerKg, notes, reason, effectiveDate } = req.body;

    // If price is updated, recalculate weight options
    if (pricePerKg && pricePerKg !== schedule.pricePerKg) {
      const KG_OPTIONS = [0.5, 1, 1.5, 2, 3];
      schedule.weightOptions = KG_OPTIONS.map((kg) => ({
        weight: kg * 1000,
        price: Math.round(pricePerKg * kg),
      }));
      schedule.pricePerKg = pricePerKg;
    }

    if (notes !== undefined) schedule.notes = notes;
    if (reason) schedule.reason = reason;
    
    // Allow changing date only if not active
    if (effectiveDate && schedule.status !== 'active') {
      const newDate = new Date(effectiveDate);
      newDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot schedule price for past dates',
        });
      }

      schedule.effectiveDate = newDate;
    }

    await schedule.save();

    res.status(200).json({
      success: true,
      message: 'Price schedule updated successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Update price schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update price schedule',
    });
  }
};

// @desc    Delete price schedule
// @route   DELETE /api/price-schedules/:id
// @access  Private/Admin
export const deletePriceSchedule = async (req, res) => {
  try {
    const schedule = await PriceSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Price schedule not found',
      });
    }

    // Don't allow deleting active schedules
    if (schedule.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active schedule. Please wait for it to expire.',
      });
    }

    await schedule.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Price schedule deleted successfully',
    });
  } catch (error) {
    console.error('Delete price schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete price schedule',
    });
  }
};

// @desc    Apply scheduled prices (run by cron job or manually)
// @route   POST /api/price-schedules/apply
// @access  Private/Admin
export const applyScheduledPrices = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all scheduled prices for today
    const schedules = await PriceSchedule.find({
      effectiveDate: { $gte: today, $lte: endOfDay },
      status: 'scheduled',
    }).populate('product');

    let applied = 0;
    let failed = 0;
    const results = [];

    for (const schedule of schedules) {
      try {
        await applySchedule(schedule._id);
        applied++;
        results.push({
          productId: schedule.product._id,
          productName: schedule.product.name,
          newPrice: schedule.pricePerKg,
          status: 'applied',
        });
      } catch (error) {
        failed++;
        results.push({
          productId: schedule.product._id,
          productName: schedule.product.name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Applied ${applied} price schedules, ${failed} failed`,
      data: {
        applied,
        failed,
        results,
      },
    });
  } catch (error) {
    console.error('Apply scheduled prices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply scheduled prices',
    });
  }
};

// @desc    Get today's active prices
// @route   GET /api/price-schedules/today
// @access  Private/Admin
export const getTodayPrices = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const schedules = await PriceSchedule.find({
      effectiveDate: { $gte: today, $lte: endOfDay },
      status: { $in: ['scheduled', 'active'] },
    }).populate('product', 'name category images price');

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error('Get today prices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch today\'s prices',
    });
  }
};

// Helper function to apply a schedule
async function applySchedule(scheduleId) {
  const schedule = await PriceSchedule.findById(scheduleId);
  if (!schedule) throw new Error('Schedule not found');

  const product = await Product.findById(schedule.product);
  if (!product) throw new Error('Product not found');

  // Update product price
  product.price = schedule.pricePerKg;
  product.weightOptions = schedule.weightOptions;
  await product.save();

  // Mark previous active schedules as expired
  await PriceSchedule.updateMany(
    {
      product: schedule.product,
      status: 'active',
      _id: { $ne: schedule._id },
    },
    { status: 'expired' }
  );

  // Mark this schedule as active
  schedule.status = 'active';
  await schedule.save();

  return schedule;
}

// @desc    Get price history for a product
// @route   GET /api/price-schedules/history/:productId
// @access  Private/Admin
export const getPriceHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 30 } = req.query;

    const history = await PriceSchedule.find({
      product: productId,
    })
      .populate('createdBy', 'name')
      .sort({ effectiveDate: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch price history',
    });
  }
};

export default {
  createPriceSchedule,
  getPriceSchedules,
  getPriceSchedule,
  getProductSchedules,
  updatePriceSchedule,
  deletePriceSchedule,
  applyScheduledPrices,
  getTodayPrices,
  getPriceHistory,
};
