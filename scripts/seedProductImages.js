/**
 * Seed Product Images Script
 * 
 * Updates existing MongoDB products with local image URLs
 * based on their category and subCategory.
 * 
 * Usage: node scripts/seedProductImages.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/Product.js';

dotenv.config();

// Image mapping by subCategory and category
const SUB_CATEGORY_IMAGES = {
  'breast':          '/images/products/chicken-breast-boneless.png',
  'breast-fillet':   '/images/products/chicken-breast-boneless.png',
  'breast-tikka':    '/images/products/chicken-breast-diced.png',
  'cube-cut':        '/images/products/chicken-breast-diced.png',
  'dragon-cut':      '/images/products/chicken-drumsticks-raw.png',
  'butterfly-cut':   '/images/products/chicken-breast-butterfly.png',
  'finger-cut':      '/images/products/chicken-breast-strips.png',
  'julienne-cut':    '/images/products/chicken-breast-strips.png',
  'lollipop':        '/images/products/chicken-lollipop-drumstick.png',
  'wings':           '/images/products/chicken-drumsticks-raw.png',
  'wings-mid-joint': '/images/products/chicken-drumsticks-raw.png',
  'legs':            '/images/products/chicken-leg-marinated.png',
  'legs-without-skin': '/images/products/chicken-leg-marinated.png',
  'thighs':          '/images/products/chicken-leg-marinated.png',
  'thighs-boneless': '/images/products/chicken-breast-boneless.png',
  'whole':           '/images/products/whole-chicken-seasoned.png',
  'boneless':        '/images/products/chicken-breast-boneless.png',
  'curry-cut':       '/images/products/chicken-drumsticks-raw.png',
  'small-curry-cut': '/images/products/chicken-drumsticks-raw.png',
  'big-curry-cut':   '/images/products/chicken-leg-marinated.png',
  '65-piece':        '/images/products/chicken-breast-diced.png',
};

const CATEGORY_IMAGES = {
  'chicken-cuts':  '/images/products/chicken-breast-boneless.png',
  'eggs':          '/images/products/chicken-breast-boneless.png',
  'live-chicken':  '/images/products/whole-chicken-seasoned.png',
  'marinades':     '/images/products/chicken-leg-marinated.png',
  'ready-to-cook': '/images/products/whole-chicken-seasoned.png',
  'organs':        '/images/products/chicken-drumsticks-raw.png',
};

const DEFAULT_IMAGE = '/images/products/chicken-breast-boneless.png';

const getImageForProduct = (product) => {
  if (product.subCategory && SUB_CATEGORY_IMAGES[product.subCategory]) {
    return SUB_CATEGORY_IMAGES[product.subCategory];
  }
  if (product.category && CATEGORY_IMAGES[product.category]) {
    return CATEGORY_IMAGES[product.category];
  }
  return DEFAULT_IMAGE;
};

const seedImages = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ No MongoDB URI found. Set MONGODB_URI or MONGO_URI in .env');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to update`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      const imageUrl = getImageForProduct(product);

      // Check if product already has a valid local image
      const existingUrl = product.images?.[0]?.url;
      if (existingUrl && existingUrl.startsWith('/images/products/')) {
        console.log(`  ⏭️  ${product.name} — already has local image`);
        skipped++;
        continue;
      }

      // Update with local image
      product.images = [{
        url: imageUrl,
        publicId: `local-${product.subCategory || product.category || 'default'}`,
      }];

      await product.save();
      console.log(`  ✅ ${product.name} → ${imageUrl}`);
      updated++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total:   ${products.length}`);
    console.log('\n🎉 Product images seeded successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding images:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedImages();
