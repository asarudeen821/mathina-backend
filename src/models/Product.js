import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
    },
    category: {
      type: String,
      required: [true, 'Please provide category'],
      enum: [
        'chicken-cuts',
        'eggs',
        'live-chicken',
        'marinades',
        'ready-to-cook',
        'organs',
      ],
    },
    subCategory: {
      type: String,
      enum: [
        'breast',
        'wings',
        'legs',
        'thighs',
        'curry-cut',
        'whole',
        'boneless',
        'cube-cut',
        'dragon-cut',
        'butterfly-cut',
        '65-piece',
        'finger-cut',
        'small-curry-cut',
        'big-curry-cut',
        'lollipop',
        'wings-mid-joint',
        'breast-tikka',
        'breast-fillet',
        'legs-without-skin',
        'thighs-boneless',
        'julienne-cut',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    weightOptions: [
      {
        weight: Number, // in grams
        price: Number,
      },
    ],
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    freshnessTag: {
      type: String,
      enum: ['fresh', 'frozen'],
      default: 'fresh',
    },
    halalCertified: {
      type: Boolean,
      default: true,
    },
    organic: {
      type: Boolean,
      default: false,
    },
    antibioticFree: {
      type: Boolean,
      default: false,
    },
    farmOrigin: {
      name: String,
      location: String,
      certification: String,
    },
    processingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    vaccinationDetails: {
      vaccinated: Boolean,
      vaccines: [String],
      lastVaccinationDate: Date,
    },
    qrCode: String,
    qrCodeData: {
      productId: String,
      farmToTable: Boolean,
      traceabilityUrl: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    festivalOffer: {
      active: Boolean,
      offerName: String,
      discountPercentage: Number,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    nutritionInfo: {
      protein: Number,
      fat: Number,
      calories: Number,
      carbohydrates: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, freshnessTag: 1 });
productSchema.index({ isFeatured: 1, isAvailable: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
