import GlobalPricing from '../models/GlobalPricing.js';
import CutPricing from '../models/CutPricing.js';
import PricingAuditLog from '../models/PricingAuditLog.js';
import Product from '../models/Product.js';

// Helper: Calculate final price based on global base price, rule, and value
const calculateFinalPrice = (basePrice, rule, value) => {
  if (rule === 'independent') {
    return Math.max(0, Math.round(value));
  } else if (rule === 'percentage') {
    return Math.max(0, Math.round(basePrice * (1 + value / 100)));
  } else if (rule === 'fixed') {
    return Math.max(0, Math.round(basePrice + value));
  }
  return basePrice;
};

// Helper: Sync cut final price to matching database products
const syncProductsWithPrice = async (cutName, finalPrice) => {
  const products = await Product.find({ subCategory: cutName });
  for (const product of products) {
    product.price = finalPrice;
    
    // Recalculate weight options based on new price per kg
    if (product.weightOptions && product.weightOptions.length > 0) {
      product.weightOptions = product.weightOptions.map((opt) => ({
        weight: opt.weight,
        price: Math.max(0, Math.round(finalPrice * (opt.weight / 1000))),
      }));
    }
    await product.save();
  }
};

// @desc    Get pricing structure (Global + Cuts)
// @route   GET /api/hierarchical-pricing
// @access  Private/Admin
export const getPricingStructure = async (req, res) => {
  try {
    let globalPricing = await GlobalPricing.findOne().sort({ createdAt: -1 });
    
    // Auto-create global pricing if not exists
    if (!globalPricing) {
      globalPricing = await GlobalPricing.create({
        basePrice: 200,
        updatedBy: req.user._id,
      });
    }

    const cuts = await CutPricing.find().sort({ displayName: 1 });

    res.status(200).json({
      success: true,
      data: {
        global: globalPricing,
        cuts,
      },
    });
  } catch (error) {
    console.error('Get pricing structure error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pricing structure',
    });
  }
};

// @desc    Update global chicken price
// @route   PUT /api/hierarchical-pricing/global
// @access  Private/Admin
export const updateGlobalPrice = async (req, res) => {
  try {
    const { basePrice, notes } = req.body;

    if (basePrice === undefined || basePrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive base price',
      });
    }

    let globalPricing = await GlobalPricing.findOne().sort({ createdAt: -1 });
    let oldBase = 200;

    if (!globalPricing) {
      globalPricing = await GlobalPricing.create({
        basePrice,
        updatedBy: req.user._id,
      });
    } else {
      oldBase = globalPricing.basePrice;
      globalPricing.basePrice = basePrice;
      globalPricing.updatedBy = req.user._id;
      await globalPricing.save();
    }

    // Log the change
    await PricingAuditLog.create({
      changeType: 'global',
      target: 'global',
      oldValue: oldBase,
      newValue: basePrice,
      changedBy: req.user._id,
      notes: notes || 'Global base price update',
    });

    // Cascade changes to dependent cuts
    const cuts = await CutPricing.find();
    for (const cut of cuts) {
      if (cut.rule !== 'independent') {
        const oldFinal = cut.finalPrice;
        const newFinal = calculateFinalPrice(basePrice, cut.rule, cut.value);
        
        if (oldFinal !== newFinal) {
          cut.finalPrice = newFinal;
          await cut.save();
          await syncProductsWithPrice(cut.cutName, newFinal);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Global base price updated and changes cascaded successfully',
      data: globalPricing,
    });
  } catch (error) {
    console.error('Update global price error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update global price',
    });
  }
};

// @desc    Update cut pricing rule and value
// @route   PUT /api/hierarchical-pricing/cut/:cutName
// @access  Private/Admin
export const updateCutPricing = async (req, res) => {
  try {
    const { cutName } = req.params;
    const { rule, value, notes } = req.body;

    if (!rule || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pricing rule and value',
      });
    }

    let globalPricing = await GlobalPricing.findOne().sort({ createdAt: -1 });
    const globalBase = globalPricing ? globalPricing.basePrice : 200;

    let cut = await CutPricing.findOne({ cutName });
    if (!cut) {
      return res.status(404).json({
        success: false,
        message: `Cut pricing config not found for: ${cutName}`,
      });
    }

    const oldConfig = {
      rule: cut.rule,
      value: cut.value,
      finalPrice: cut.finalPrice,
    };

    const newFinalPrice = calculateFinalPrice(globalBase, rule, value);

    cut.rule = rule;
    cut.value = value;
    cut.finalPrice = newFinalPrice;
    await cut.save();

    // Log the change
    await PricingAuditLog.create({
      changeType: 'cut',
      target: cutName,
      oldValue: oldConfig,
      newValue: { rule, value, finalPrice: newFinalPrice },
      rule,
      changedBy: req.user._id,
      notes: notes || `Cut pricing update for ${cut.displayName}`,
    });

    // Sync changes to matching products
    await syncProductsWithPrice(cutName, newFinalPrice);

    res.status(200).json({
      success: true,
      message: `${cut.displayName} pricing configuration updated successfully`,
      data: cut,
    });
  } catch (error) {
    console.error('Update cut pricing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cut pricing configuration',
    });
  }
};

// @desc    Get pricing change history and audit trail
// @route   GET /api/hierarchical-pricing/history
// @access  Private/Admin
export const getPricingHistory = async (req, res) => {
  try {
    const logs = await PricingAuditLog.find()
      .populate('changedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get pricing history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pricing history',
    });
  }
};
