import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected:', conn.connection.host);
    
    // Drop the problematic index directly
    const collection = conn.connection.collection('products');
    
    try {
      await collection.dropIndex('qrCode_1');
      console.log('✅ Dropped qrCode_1 index');
    } catch (err) {
      console.log('ℹ️  Index qrCode_1 does not exist or already dropped');
    }
    
    // Drop all indexes and let Mongoose recreate them
    await collection.dropIndexes();
    console.log('✅ Dropped all indexes');
    
    console.log('\n🎉 Indexes fixed! Now run: npm run seed');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixIndexes();
