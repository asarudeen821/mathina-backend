import mongoose from 'mongoose';

const qrCodeSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    qrCodeString: {
      type: String,
      required: true,
      unique: true,
    },
    qrCodeImage: {
      type: String, // Base64 or URL
    },
    traceabilityData: {
      productId: {
        type: String,
        required: true,
      },
      productName: String,
      farmName: String,
      farmLocation: String,
      processingDate: Date,
      expiryDate: Date,
      vaccinationDetails: {
        vaccinated: Boolean,
        vaccines: [String],
        lastVaccinationDate: Date,
      },
      organicCertified: Boolean,
      antibioticFree: Boolean,
      halalCertified: Boolean,
      qualityCheck: {
        passed: Boolean,
        checkedBy: String,
        checkedAt: Date,
      },
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: Date,
    lastScannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

qrCodeSchema.index({ product: 1 });

const QRCode = mongoose.model('QRCode', qrCodeSchema);

export default QRCode;
