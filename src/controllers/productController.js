import Product from '../models/Product.js';
import QRCode from '../models/QRCode.js';
import QRCodeLib from 'qrcode';

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      freshnessTag,
      organic,
      halalCertified,
      minPrice,
      maxPrice,
      search,
      isFeatured,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    let query = { isAvailable: true };

    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (freshnessTag) query.freshnessTag = freshnessTag;
    if (organic) query.organic = organic === 'true';
    if (halalCertified !== undefined) query.halalCertified = halalCertified === 'true';
    if (isFeatured) query.isFeatured = isFeatured === 'true';

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort
    const sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.price = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sortOptions.name = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product',
    });
  }
};

// @desc    Create product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Soft delete - mark as unavailable
    product.isAvailable = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isFeatured: true,
      isAvailable: true,
    }).limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch featured products',
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category,
      isAvailable: true,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    });
  }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
export const updateStock = async (req, res) => {
  try {
    const { stock } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update stock',
    });
  }
};

// @desc    Generate QR code for product
// @route   POST /api/products/:id/qr-code
// @access  Private/Admin
export const generateQRCode = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Generate unique QR code string
    const qrCodeString = `CLUCKFRESH-${product._id}-${Date.now()}`;

    // Generate QR code image (base64)
    const qrCodeImage = await QRCodeLib.toDataURL(qrCodeString);

    // Create or update QR code record
    let qrCodeRecord = await QRCode.findOne({ product: product._id });

    if (qrCodeRecord) {
      qrCodeRecord.qrCodeString = qrCodeString;
      qrCodeRecord.qrCodeImage = qrCodeImage;
      qrCodeRecord.traceabilityData = {
        productId: product._id.toString(),
        productName: product.name,
        farmName: product.farmOrigin?.name,
        farmLocation: product.farmOrigin?.location,
        processingDate: product.processingDate,
        expiryDate: product.expiryDate,
        vaccinationDetails: product.vaccinationDetails,
        organicCertified: product.organic,
        antibioticFree: product.antibioticFree,
        halalCertified: product.halalCertified,
        qualityCheck: {
          passed: true,
          checkedBy: req.user.name,
          checkedAt: new Date(),
        },
      };
      await qrCodeRecord.save();
    } else {
      qrCodeRecord = await QRCode.create({
        product: product._id,
        qrCodeString,
        qrCodeImage,
        traceabilityData: {
          productId: product._id.toString(),
          productName: product.name,
          farmName: product.farmOrigin?.name,
          farmLocation: product.farmOrigin?.location,
          processingDate: product.processingDate,
          expiryDate: product.expiryDate,
          vaccinationDetails: product.vaccinationDetails,
          organicCertified: product.organic,
          antibioticFree: product.antibioticFree,
          halalCertified: product.halalCertified,
          qualityCheck: {
            passed: true,
            checkedBy: req.user.name,
            checkedAt: new Date(),
          },
        },
      });
    }

    // Update product with QR code
    product.qrCode = qrCodeString;
    product.qrCodeData = {
      productId: product._id.toString(),
      farmToTable: true,
      traceabilityUrl: `/api/qr/scan/${qrCodeString}`,
    };
    await product.save();

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCodeString,
        qrCodeImage,
        qrCodeId: qrCodeRecord._id,
      },
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate QR code',
    });
  }
};
