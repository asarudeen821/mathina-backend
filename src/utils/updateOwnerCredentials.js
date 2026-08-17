import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

/**
 * Migration script to update the shop owner credentials:
 * - Email: mathinachicken@gmail.com → madinachicken@gmail.com
 * - Password: mathina65 → madinachicken65
 */
const updateOwnerCredentials = async () => {
  try {
    await connectDB();
    console.log('🔗 Connected to database');

    // Find the old admin user
    const oldAdmin = await User.findOne({ email: 'mathinachicken@gmail.com' });

    if (oldAdmin) {
      console.log('📋 Found existing admin user with old email: mathinachicken@gmail.com');
      
      // Check if new email already exists (to avoid duplicate key error)
      const existingNew = await User.findOne({ email: 'madinachicken@gmail.com' });
      if (existingNew) {
        console.log('⚠️  User with madinachicken@gmail.com already exists. Removing old entry...');
        await User.deleteOne({ email: 'mathinachicken@gmail.com' });
        // Update the existing user's password
        existingNew.password = 'madinachicken65';
        existingNew.role = 'admin';
        await existingNew.save();
        console.log('✅ Updated existing madinachicken@gmail.com user with new password and admin role');
      } else {
        // Update email and password
        oldAdmin.email = 'madinachicken@gmail.com';
        oldAdmin.password = 'madinachicken65';
        await oldAdmin.save(); // This triggers the pre-save hook to hash the password
        console.log('✅ Updated admin credentials successfully');
      }
    } else {
      console.log('⚠️  No admin user found with mathinachicken@gmail.com');
      
      // Check if the new email already exists
      const existingNew = await User.findOne({ email: 'madinachicken@gmail.com' });
      if (existingNew) {
        console.log('✅ Admin user with madinachicken@gmail.com already exists');
        // Update password and ensure admin role
        existingNew.password = 'madinachicken65';
        existingNew.role = 'admin';
        await existingNew.save();
        console.log('✅ Updated password for existing admin');
      } else {
        // Create new admin user
        const newAdmin = await User.create({
          name: 'Shajan A.J.',
          email: 'madinachicken@gmail.com',
          phone: '7708032726',
          password: 'madinachicken65',
          role: 'admin',
          address: {
            street: 'Erusappan Pallivasal Street',
            area: 'Cuddalore OT',
            city: 'Cuddalore',
            state: 'Tamil Nadu',
            pincode: '607003',
          },
        });
        console.log('✅ Created new admin user');
      }
    }

    console.log('\n📋 Updated Shop Owner Credentials:');
    console.log('   Email: madinachicken@gmail.com');
    console.log('   Password: madinachicken65');
    console.log('\n🎉 Migration complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

updateOwnerCredentials();
