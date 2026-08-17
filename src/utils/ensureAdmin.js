import User from '../models/User.js';

/**
 * Strictly secures and ensures the default shop owner admin user exists in MongoDB.
 * Primary Shop Owner Gmail: madinachicken@gmail.com
 * Primary Shop Owner Password: madinachicken65
 */
export const ensureAdminUser = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'madinachicken@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'madinachicken65';

    // Remove legacy email entries to prevent security confusion
    await User.deleteMany({ email: 'mathinachicken@gmail.com' });

    // Check if primary admin user exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      let updated = false;
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        updated = true;
      }
      if (updated) {
        await existingAdmin.save();
        console.log(`🔒 Shop Owner admin account secured: ${adminEmail}`);
      } else {
        console.log(`🔒 Shop Owner admin account verified: ${adminEmail}`);
      }
      return;
    }

    // Create default shop owner admin account
    await User.create({
      name: 'Shajan A.J.',
      email: adminEmail,
      phone: '7708032726',
      password: adminPassword,
      role: 'admin',
      address: {
        street: 'Erusappan Pallivasal Street',
        area: 'Cuddalore OT',
        city: 'Cuddalore',
        state: 'Tamil Nadu',
        pincode: '607003',
      },
      shopDetails: {
        shopName: 'Mathina FreshHub',
        shopAddress: 'Erusappan Pallivasal Street, Cuddalore OT',
        licenseNumber: 'TN-CUD-2024-001',
      },
    });

    console.log(`🎉 Auto-created and secured Shop Owner account: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error securing admin user:', error.message);
  }
};

