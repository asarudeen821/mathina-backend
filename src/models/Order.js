import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.Mixed, // Allow ObjectId or string for virtual products
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        weight: Number, // in grams
        price: {
          type: Number,
          required: true,
        },
        image: String,
        isVirtual: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Please provide total amount'],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    coupon: {
      code: String,
      discount: Number,
      description: String,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    paymentInfo: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      upiId: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      method: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet', 'cod'],
      },
      paidAt: Date,
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
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    deliveryTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'custom'],
    },
    deliverySlot: {
      date: Date,
      timeRange: String,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'out-for-delivery', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    deliveryBoy: {
      name: String,
      phone: String,
      vehicleNumber: String,
    },
    tracking: {
      placed: {
        type: Boolean,
        default: true,
      },
      confirmed: {
        type: Boolean,
        default: false,
      },
      processing: {
        type: Boolean,
        default: false,
      },
      outForDelivery: {
        type: Boolean,
        default: false,
      },
      delivered: {
        type: Boolean,
        default: false,
      },
    },
    deliveryInstructions: String,
    cancellationReason: String,
    isSubscriptionOrder: {
      type: Boolean,
      default: false,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying orders by user and status
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
