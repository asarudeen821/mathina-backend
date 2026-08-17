import mongoose from 'mongoose';

const priceScheduleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Please provide effective date'],
    },
    pricePerKg: {
      type: Number,
      required: [true, 'Please provide price per kg'],
      min: 0,
    },
    weightOptions: [
      {
        weight: Number, // in grams
        price: Number,
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'active', 'expired'],
      default: 'scheduled',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    reason: {
      type: String,
      enum: ['market-rate', 'festival-demand', 'supply-shortage', 'seasonal', 'promotion', 'other'],
      default: 'market-rate',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
priceScheduleSchema.index({ product: 1, effectiveDate: -1 });
priceScheduleSchema.index({ effectiveDate: 1, status: 1 });
priceScheduleSchema.index({ status: 1 });

// Method to check if schedule is active
priceScheduleSchema.methods.isActive = function () {
  const now = new Date();
  const startOfDay = new Date(this.effectiveDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(this.effectiveDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return now >= startOfDay && now <= endOfDay;
};

// Static method to get active price for a product
priceScheduleSchema.statics.getActivePrice = async function (productId) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const schedule = await this.findOne({
    product: productId,
    effectiveDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'active'] },
  }).sort({ createdAt: -1 });

  return schedule;
};

// Static method to get upcoming schedules
priceScheduleSchema.statics.getUpcomingSchedules = async function (productId) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return await this.find({
    product: productId,
    effectiveDate: { $gte: now },
    status: 'scheduled',
  }).sort({ effectiveDate: 1 });
};

const PriceSchedule = mongoose.model('PriceSchedule', priceScheduleSchema);

export default PriceSchedule;
