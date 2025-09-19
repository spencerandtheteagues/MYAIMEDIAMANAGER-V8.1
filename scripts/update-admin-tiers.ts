#!/usr/bin/env node

import { storage } from '../server/storage';

async function updateAdminTiers() {
  try {
    console.log('Updating all admin accounts to enterprise tier...');

    // Get all users
    const allUsers = await storage.getAllUsers();

    // Filter admin users
    const adminUsers = allUsers.filter(user => user.role === 'admin');

    console.log(`Found ${adminUsers.length} admin users`);

    let updatedCount = 0;

    for (const admin of adminUsers) {
      if (admin.tier !== 'enterprise') {
        console.log(`Updating ${admin.fullName || admin.username} (${admin.email}) from ${admin.tier} to enterprise`);

        await storage.updateUser(admin.id, {
          tier: 'enterprise'
        });

        updatedCount++;
      } else {
        console.log(`${admin.fullName || admin.username} (${admin.email}) already has enterprise tier`);
      }
    }

    console.log(`\nCompleted! Updated ${updatedCount} admin accounts to enterprise tier.`);

  } catch (error) {
    console.error('Error updating admin tiers:', error);
    process.exit(1);
  }
}

// Run the script
updateAdminTiers().then(() => {
  console.log('Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});