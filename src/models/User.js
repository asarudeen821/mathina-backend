import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    shopDetails: {
      shopName: String,
      shopAddress: String,
      licenseNumber: String,
    },
    address: {
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
    },
    deliveryZones: {
      type: [String],
      default: [],
    },
    preferences: {
      language: {
        type: String,
        enum: ['english', 'tamil'],
        default: 'english',
      },
      dietaryPreferences: [String],
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for better query performance
// Note: email index is already created by `unique: true` in the schema field definition
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;
