import mongoose from 'mongoose';

const pricingAuditLogSchema = new mongoose.Schema(
  {
    changeType: {
      type: String,
      enum: ['global', 'cut'],
      required: true,
    },
    target: {
      type: String, // 'global' or the subCategory (e.g. 'breast')
      required: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    rule: {
      type: String,
      enum: ['independent', 'percentage', 'fixed', 'N/A'],
      default: 'N/A',
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const PricingAuditLog = mongoose.model('PricingAuditLog', pricingAuditLogSchema);
export default PricingAuditLog;
