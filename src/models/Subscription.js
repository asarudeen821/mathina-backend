import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planType: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'custom'],
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
        },
        weight: Number,
        price: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['every-week', 'every-2-weeks', 'every-month'],
      required: true,
    },
    deliveryDay: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    deliveryTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    nextDeliveryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'completed'],
      default: 'active',
    },
    deliveryAddress: {
      street: String,
      area: String,
      city: {
        type: String,
        default: 'Chennai',
      },
      state: {
        type: String,
        default: 'Tamil Nadu',
      },
      pincode: String,
      landmark: String,
      phone: String,
    },
    paymentMethod: {
      type: String,
      enum: ['auto-debit', 'manual', 'cod'],
      default: 'auto-debit',
    },
    pauseReason: String,
    pausedAt: Date,
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
    },
    skippedDates: [Date],
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ user: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
