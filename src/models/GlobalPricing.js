import mongoose from 'mongoose';

const globalPricingSchema = new mongoose.Schema(
  {
    basePrice: {
      type: Number,
      required: [true, 'Please provide global base price'],
      min: [0, 'Base price cannot be negative'],
      default: 200,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const GlobalPricing = mongoose.model('GlobalPricing', globalPricingSchema);
export default GlobalPricing;
