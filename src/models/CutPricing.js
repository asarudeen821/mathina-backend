import mongoose from 'mongoose';

const cutPricingSchema = new mongoose.Schema(
  {
    cutName: {
      type: String,
      required: true,
      unique: true, // matches subCategory (e.g. 'breast', 'wings')
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    rule: {
      type: String,
      enum: ['independent', 'percentage', 'fixed'],
      required: true,
      default: 'independent',
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const CutPricing = mongoose.model('CutPricing', cutPricingSchema);
export default CutPricing;
