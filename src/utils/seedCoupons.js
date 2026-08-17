import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';

dotenv.config();

// Connect to database
connectDB();

const seedCoupons = async () => {
  try {
    console.log('🎫 Seeding coupons...');

    // Clear existing coupons
    await Coupon.deleteMany({});
    console.log('✅ Cleared existing coupons');

    // Find Biryani Cut products
    const biryaniProducts = await Product.find({
      subCategory: { $in: ['big-curry-cut', 'biryani-cut'] }
    });

    console.log(`Found ${biryaniProducts.length} Biryani Cut products`);

    // Create MATHINA2024 Festival Coupon
    const festivalCoupon = await Coupon.create({
      code: 'MATHINA2024',
      description: '🎉 Festival Special Offer! Get 15% off on Biryani Cut & Big Curry Cut',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 0,
      maxDiscountAmount: 100, // Max discount of ₹100
      applicableProducts: biryaniProducts.map(p => p._id),
      applicableSubCategories: ['big-curry-cut', 'biryani-cut'],
      usageLimit: 1000,
      usageCount: 0,
      usedBy: [],
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
    });

    console.log('✅ Created MATHINA2024 coupon');
    console.log(`   Code: ${festivalCoupon.code}`);
    console.log(`   Discount: ${festivalCoupon.discountValue}%`);
    console.log(`   Valid until: ${festivalCoupon.endDate.toLocaleDateString('en-IN')}`);
    console.log(`   Applicable to: ${festivalCoupon.applicableSubCategories.join(', ')}`);

    console.log('\n🎉 Coupons seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding coupons:', error);
    process.exit(1);
  }
};

seedCoupons();
