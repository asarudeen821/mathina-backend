import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

dotenv.config();

const fixIndexes = async () => {
  try {
    await connectDB();
    
    const Product = mongoose.model('Product');
    
    // Drop the problematic index
    await Product.collection.dropIndex('qrCode_1');
    console.log('✅ Dropped qrCode_1 index');
    
    // Create new sparse index
    await Product.collection.createIndex({ qrCode: 1 }, { unique: true, sparse: true });
    console.log('✅ Created new sparse unique index on qrCode');
    
    console.log('\n🎉 Index fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixIndexes();
