import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import User from '../models/User.js';
import GlobalPricing from '../models/GlobalPricing.js';
import CutPricing from '../models/CutPricing.js';
import connectDB from '../config/db.js';

dotenv.config();

// Sample products data
const products = [
  {
    name: 'Fresh Chicken Breast',
    description: 'Premium quality boneless chicken breast, perfect for grilling and salads',
    category: 'chicken-cuts',
    subCategory: 'breast',
    price: 280,
    stock: 50,
    weightOptions: [
      { weight: 250, price: 70 },
      { weight: 500, price: 140 },
      { weight: 1000, price: 280 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&h=400&fit=crop',
      publicId: 'chicken-breast-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    organic: true,
    antibioticFree: true,
    farmOrigin: {
      name: 'Sri Venkateswara Farms',
      location: 'Kanchipuram, Tamil Nadu',
      certification: 'Organic Certified',
    },
    isFeatured: true,
    ratings: { average: 4.8, count: 156 },
    nutritionInfo: {
      protein: 31,
      fat: 3.6,
      calories: 165,
      carbohydrates: 0,
    },
  },
  {
    name: 'Chicken Cube Cut (Small Pieces)',
    description: 'Perfectly diced small cube-sized chicken pieces, ideal for stir-fry, fried rice, and noodles. Quick-cooking and tender.',
    category: 'chicken-cuts',
    subCategory: 'cube-cut',
    price: 270,
    stock: 40,
    weightOptions: [
      { weight: 250, price: 67.5 },
      { weight: 500, price: 135 },
      { weight: 1000, price: 270 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=600&h=400&fit=crop',
      publicId: 'chicken-cube-cut-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    ratings: { average: 4.7, count: 89 },
    nutritionInfo: {
      protein: 28,
      fat: 4,
      calories: 170,
      carbohydrates: 0,
    },
  },
  {
    name: 'Chicken Dragon Cut',
    description: 'Special cut with long, drumstick-like pieces perfect for Chettinad dragon chicken. Impressive presentation and juicy taste.',
    category: 'chicken-cuts',
    subCategory: 'dragon-cut',
    price: 290,
    stock: 35,
    weightOptions: [
      { weight: 500, price: 145 },
      { weight: 1000, price: 290 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop',
      publicId: 'chicken-dragon-cut-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    festivalOffer: {
      active: true,
      offerName: 'Chef Special',
      discountPercentage: 10,
    },
    ratings: { average: 4.9, count: 124 },
  },
  {
    name: 'Chicken Butterfly Cut',
    description: 'Boneless chicken breast split open like butterfly wings. Perfect for grilling, stuffing, and restaurant-style presentations.',
    category: 'chicken-cuts',
    subCategory: 'butterfly-cut',
    price: 320,
    stock: 30,
    weightOptions: [
      { weight: 250, price: 80 },
      { weight: 500, price: 160 },
      { weight: 1000, price: 320 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&h=400&fit=crop',
      publicId: 'chicken-butterfly-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    organic: true,
    isFeatured: true,
    ratings: { average: 4.8, count: 67 },
  },
  {
    name: 'Chicken 65 Pieces',
    description: 'Signature small boneless pieces marinated and ready for Chicken 65 preparation. Spicy, crispy, and irresistible.',
    category: 'ready-to-cook',
    subCategory: '65-piece',
    price: 300,
    stock: 45,
    weightOptions: [
      { weight: 250, price: 75 },
      { weight: 500, price: 150 },
      { weight: 1000, price: 300 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1606491956689-2ea28c6746f5?w=600&h=400&fit=crop',
      publicId: 'chicken-65-piece-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    ratings: { average: 4.9, count: 201 },
  },
  {
    name: 'Chicken Finger Cut',
    description: 'Long, thin strips perfect for chicken fingers, stir-fry, and wraps. Uniform size for even cooking.',
    category: 'chicken-cuts',
    subCategory: 'finger-cut',
    price: 280,
    stock: 40,
    weightOptions: [
      { weight: 250, price: 70 },
      { weight: 500, price: 140 },
      { weight: 1000, price: 280 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&h=400&fit=crop',
      publicId: 'chicken-finger-cut-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.6, count: 78 },
  },
  {
    name: 'Chicken Julienne Cut',
    description: 'Ultra-thin matchstick-sized chicken strips, perfect for quick stir-fry, noodles, fried rice, and Asian dishes. Cooks in minutes with tender, uniform pieces.',
    category: 'chicken-cuts',
    subCategory: 'julienne-cut',
    price: 290,
    stock: 35,
    weightOptions: [
      { weight: 250, price: 72.5 },
      { weight: 500, price: 145 },
      { weight: 1000, price: 290 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&h=400&fit=crop&q=80',
      publicId: 'chicken-julienne-cut-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    ratings: { average: 4.7, count: 64 },
    nutritionInfo: {
      protein: 29,
      fat: 3.5,
      calories: 168,
      carbohydrates: 0,
    },
  },
  {
    name: 'Chicken Wings',
    description: 'Juicy chicken wings, ideal for frying, grilling, or BBQ. Perfect for parties and game day snacks.',
    category: 'chicken-cuts',
    subCategory: 'wings',
    price: 220,
    stock: 40,
    weightOptions: [
      { weight: 250, price: 55 },
      { weight: 500, price: 110 },
      { weight: 1000, price: 220 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&h=400&fit=crop',
      publicId: 'chicken-wings-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    ratings: { average: 4.6, count: 98 },
  },
  {
    name: 'Chicken Lollipop',
    description: 'Frenched drumettes shaped like lollipops. Restaurant-quality cut perfect for appetizers and kids.',
    category: 'chicken-cuts',
    subCategory: 'lollipop',
    price: 310,
    stock: 35,
    weightOptions: [
      { weight: 250, price: 77.5 },
      { weight: 500, price: 155 },
      { weight: 1000, price: 310 },
    ],
    images: [{
      url: '/images/products/chicken-lollipop.png',
      publicId: 'chicken-lollipop-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    ratings: { average: 4.8, count: 112 },
  },
  {
    name: 'Chicken Legs (Drumsticks)',
    description: 'Tender chicken drumsticks, great for curries and roasts. A family favorite cut.',
    category: 'chicken-cuts',
    subCategory: 'legs',
    price: 180,
    stock: 60,
    weightOptions: [
      { weight: 250, price: 45 },
      { weight: 500, price: 90 },
      { weight: 1000, price: 180 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&h=400&fit=crop',
      publicId: 'chicken-legs-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.7, count: 124 },
  },
  {
    name: 'Chicken Thighs Boneless',
    description: 'Juicy, flavorful boneless thighs. Perfect for curries, grilling, and stir-fry. More flavorful than breast.',
    category: 'chicken-cuts',
    subCategory: 'thighs-boneless',
    price: 260,
    stock: 40,
    weightOptions: [
      { weight: 250, price: 65 },
      { weight: 500, price: 130 },
      { weight: 1000, price: 260 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&h=400&fit=crop',
      publicId: 'chicken-thighs-boneless-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.7, count: 93 },
  },
  {
    name: 'Whole Chicken',
    description: 'Fresh whole chicken, cleaned and dressed, ready to cook. Perfect for roasting or traditional curries.',
    category: 'chicken-cuts',
    subCategory: 'whole',
    price: 200,
    stock: 30,
    weightOptions: [
      { weight: 1000, price: 200 },
      { weight: 1500, price: 300 },
      { weight: 2000, price: 400 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&h=400&fit=crop',
      publicId: 'whole-chicken-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    ratings: { average: 4.9, count: 210 },
  },
  {
    name: 'Boneless Curry Cut',
    description: 'Convenient boneless curry cut pieces, perfect for quick cooking. No bones, no hassle.',
    category: 'chicken-cuts',
    subCategory: 'curry-cut',
    price: 260,
    stock: 45,
    weightOptions: [
      { weight: 250, price: 65 },
      { weight: 500, price: 130 },
      { weight: 1000, price: 260 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=600&h=400&fit=crop',
      publicId: 'curry-cut-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.7, count: 89 },
  },
  {
    name: 'Small Curry Cut (with Bone)',
    description: 'Traditional small pieces with bone for authentic curry flavor. Chennai style cut.',
    category: 'chicken-cuts',
    subCategory: 'small-curry-cut',
    price: 240,
    stock: 50,
    weightOptions: [
      { weight: 250, price: 60 },
      { weight: 500, price: 120 },
      { weight: 1000, price: 240 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&h=400&fit=crop',
      publicId: 'small-curry-cut-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.8, count: 156 },
  },
  {
    name: 'Biryani Cut (Big Curry Cut)',
    description: 'Large bone-in pieces specially cut for biryani and pulao. Restaurant-style cut that gives rich flavor to every grain of rice.',
    category: 'chicken-cuts',
    subCategory: 'big-curry-cut',
    price: 240,
    stock: 60,
    weightOptions: [
      { weight: 500, price: 120 },
      { weight: 1000, price: 240 },
      { weight: 1500, price: 360 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop',
      publicId: 'biryani-cut-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    isFeatured: true,
    festivalOffer: {
      active: true,
      offerName: 'Biryani Special',
      discountPercentage: 10,
    },
    ratings: { average: 4.9, count: 198 },
  },
  {
    name: 'Fresh Farm Eggs (Large)',
    description: 'Fresh brown eggs from free-range chickens, pack of 12',
    category: 'eggs',
    price: 84,
    stock: 100,
    weightOptions: [
      { weight: 600, price: 84 }, // 12 eggs approx
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&h=400&fit=crop',
      publicId: 'farm-eggs-001'
    }],
    freshnessTag: 'fresh',
    organic: true,
    isFeatured: true,
    ratings: { average: 4.8, count: 312 },
  },
  {
    name: 'Chicken Marinade - Tandoori',
    description: 'Authentic tandoori marinade, ready-to-use for perfect tandoori chicken',
    category: 'marinades',
    price: 120,
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop',
      publicId: 'tandoori-marinade-001'
    }],
    freshnessTag: 'frozen',
    halalCertified: true,
    ratings: { average: 4.5, count: 67 },
  },
  {
    name: 'Chicken Marinade - Tikka',
    description: 'Spicy tikka marinade for delicious chicken tikka at home',
    category: 'marinades',
    price: 120,
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop',
      publicId: 'tikka-marinade-001'
    }],
    freshnessTag: 'frozen',
    halalCertified: true,
    ratings: { average: 4.6, count: 54 },
  },
  {
    name: 'Ready-to-Cook Chicken Biryani Kit',
    description: 'Complete biryani kit with marinated chicken and spices, serves 4',
    category: 'ready-to-cook',
    price: 350,
    stock: 20,
    images: [{
      url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop',
      publicId: 'biryani-kit-001'
    }],
    freshnessTag: 'frozen',
    halalCertified: true,
    isFeatured: true,
    festivalOffer: {
      active: true,
      offerName: 'Pongal Special',
      discountPercentage: 15,
    },
    ratings: { average: 4.9, count: 178 },
  },
  {
    name: 'Chicken Liver',
    description: 'Fresh chicken liver, rich in iron and nutrients',
    category: 'organs',
    price: 100,
    stock: 30,
    images: [{
      url: 'https://images.unsplash.com/photo-1543362906-ac1b48263852?w=600&h=400&fit=crop',
      publicId: 'chicken-liver-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.4, count: 45 },
  },
  {
    name: 'Chicken Gizzard',
    description: 'Clean and fresh chicken gizzard, perfect for stir-fry',
    category: 'organs',
    price: 120,
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1543362906-ac1b48263852?w=600&h=400&fit=crop',
      publicId: 'chicken-gizzard-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.5, count: 38 },
  },
  {
    name: 'Live Chicken (Broiler)',
    description: 'Healthy live broiler chicken, directly from farm',
    category: 'live-chicken',
    price: 180,
    stock: 100,
    weightOptions: [
      { weight: 1000, price: 180 },
      { weight: 1500, price: 270 },
      { weight: 2000, price: 360 },
    ],
    images: [{
      url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&h=400&fit=crop',
      publicId: 'live-chicken-001'
    }],
    freshnessTag: 'fresh',
    halalCertified: true,
    ratings: { average: 4.6, count: 92 },
  },
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to DB
    await connectDB();

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    await GlobalPricing.deleteMany({});
    await CutPricing.deleteMany({});

    console.log('📦 Cleared existing data');

    // Insert products
    await Product.insertMany(products);
    console.log(`✅ Inserted ${products.length} products`);

    // Create admin user
    const adminUser = await User.create({
      name: 'Shajan A.J.',
      email: 'madinachicken@gmail.com',
      phone: '7708032726',
      password: process.env.ADMIN_PASSWORD || 'madinachicken65',
      role: 'admin',
      address: {
        street: 'Erusappan Pallivasal Street',
        area: 'Cuddalore OT',
        city: 'Cuddalore',
        state: 'Tamil Nadu',
        pincode: '607003',
      },
    });

    console.log('✅ Created shop owner account');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'madinachicken65'}`);

    // Create global pricing
    await GlobalPricing.create({
      basePrice: 200,
      updatedBy: adminUser._id,
    });
    console.log('✅ Seeded default global pricing (basePrice: ₹200)');

    // Create default cuts pricing
    const defaultCuts = [
      { cutName: 'breast', displayName: 'Boneless Breast', rule: 'fixed', value: 80, finalPrice: 280 },
      { cutName: 'cube-cut', displayName: 'Cube Cut', rule: 'fixed', value: 70, finalPrice: 270 },
      { cutName: 'dragon-cut', displayName: 'Dragon Cut', rule: 'fixed', value: 90, finalPrice: 290 },
      { cutName: 'butterfly-cut', displayName: 'Butterfly Cut', rule: 'percentage', value: 60, finalPrice: 320 },
      { cutName: '65-piece', displayName: 'Chicken 65 Pieces', rule: 'percentage', value: 50, finalPrice: 300 },
      { cutName: 'finger-cut', displayName: 'Finger Cut', rule: 'fixed', value: 80, finalPrice: 280 },
      { cutName: 'julienne-cut', displayName: 'Julienne Cut', rule: 'fixed', value: 90, finalPrice: 290 },
      { cutName: 'wings', displayName: 'Chicken Wings', rule: 'fixed', value: 20, finalPrice: 220 },
      { cutName: 'lollipop', displayName: 'Chicken Lollipop', rule: 'independent', value: 310, finalPrice: 310 },
      { cutName: 'legs', displayName: 'Chicken Legs', rule: 'fixed', value: -20, finalPrice: 180 },
      { cutName: 'thighs-boneless', displayName: 'Thighs Boneless', rule: 'fixed', value: 60, finalPrice: 260 },
      { cutName: 'whole', displayName: 'Whole Chicken', rule: 'fixed', value: 0, finalPrice: 200 },
      { cutName: 'curry-cut', displayName: 'Curry Cut (Boneless)', rule: 'fixed', value: 60, finalPrice: 260 },
      { cutName: 'small-curry-cut', displayName: 'Small Curry Cut', rule: 'fixed', value: 40, finalPrice: 240 },
      { cutName: 'big-curry-cut', displayName: 'Big Curry Cut', rule: 'fixed', value: 40, finalPrice: 240 },
    ];
    await CutPricing.insertMany(defaultCuts);
    console.log(`✅ Seeded ${defaultCuts.length} default cut pricing configurations`);

    // Create sample customer
    const customerUser = await User.create({
      name: 'Rajesh Kumar',
      email: 'customer@example.com',
      phone: '9876543210',
      password: 'Customer@123',
      role: 'customer',
      address: {
        street: 'MG Road',
        area: 'T Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
      },
      loyaltyPoints: 100,
    });

    console.log('✅ Created sample customer');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Admin: ${adminUser.email} / ${process.env.ADMIN_PASSWORD || 'madinachicken65'}`);
    console.log(`   Customer: ${customerUser.email} / Customer@123`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
