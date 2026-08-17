import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
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
          default: 1,
        },
        weight: {
          type: Number, // in grams
        },
        price: {
          type: Number,
          required: true,
        },
        image: String,
        category: String,
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving
cartSchema.pre('save', function (next) {
  const cart = this;

  // Calculate total amount
  cart.totalAmount = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // Apply delivery fee (free above ₹500)
  cart.deliveryFee = cart.totalAmount >= 500 ? 0 : 50;

  // Calculate final amount
  cart.finalAmount = cart.totalAmount + cart.deliveryFee;

  next();
});

// Note: user index is already created by `unique: true` in the schema field definition

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
