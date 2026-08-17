import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    applicableCategories: [{
      type: String,
    }],
    applicableSubCategories: [{
      type: String,
    }],
    usageLimit: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      usedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = async function (userId, orderAmount) {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    return { valid: false, message: 'Coupon is not active' };
  }
  
  // Check date range
  if (now < this.startDate) {
    return { valid: false, message: 'Coupon is not yet active' };
  }
  if (now > this.endDate) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  }
  
  // Check if user already used this coupon
  if (userId) {
    const userUsage = this.usedBy.find(u => u.user.toString() === userId.toString());
    if (userUsage) {
      return { valid: false, message: 'You have already used this coupon' };
    }
  }
  
  return { valid: true, message: 'Coupon is valid' };
};

// Static method to validate and apply coupon
couponSchema.statics.validateAndApply = async function (code, userId, cartItems, orderAmount) {
  const coupon = await this.findOne({ code: code.toUpperCase(), isActive: true });
  
  if (!coupon) {
    return { success: false, message: 'Invalid coupon code' };
  }
  
  // Check if coupon is valid
  const validity = await coupon.isValid(userId, orderAmount);
  if (!validity.valid) {
    return { success: false, message: validity.message };
  }
  
  // Calculate discount
  let discount = 0;
  
  if (coupon.discountType === 'percentage') {
    // Check if coupon applies to specific products/categories
    if (coupon.applicableProducts.length > 0 || coupon.applicableCategories.length > 0 || coupon.applicableSubCategories.length > 0) {
      // Calculate discount only on applicable items
      let applicableAmount = 0;
      
      cartItems.forEach(item => {
        const isApplicable = 
          (coupon.applicableProducts.length > 0 && coupon.applicableProducts.some(p => p.toString() === item._id.toString())) ||
          (coupon.applicableCategories.length > 0 && coupon.applicableCategories.includes(item.category)) ||
          (coupon.applicableSubCategories.length > 0 && coupon.applicableSubCategories.includes(item.subCategory));
        
        if (isApplicable) {
          applicableAmount += (item.price * item.quantity);
        }
      });
      
      discount = (applicableAmount * coupon.discountValue) / 100;
    } else {
      // Apply to entire order
      discount = (orderAmount * coupon.discountValue) / 100;
    }
    
    // Apply max discount cap
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === 'fixed') {
    discount = coupon.discountValue;
  }
  
  // Ensure discount doesn't exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }
  
  return {
    success: true,
    message: 'Coupon applied successfully',
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
    discount: Number(discount.toFixed(2)),
    finalAmount: Number((orderAmount - discount).toFixed(2)),
  };
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
