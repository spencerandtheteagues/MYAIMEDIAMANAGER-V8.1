#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixEnterpriseTier() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing enterprise tier constraint and upgrading admin users...');

    // Step 1: Drop and recreate the constraint with enterprise tier
    console.log('1️⃣ Updating tier constraint to include enterprise...');

    await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier');

    await client.query(`
      ALTER TABLE users ADD CONSTRAINT chk_user_tier CHECK (tier IN (
        'lite', 'free', 'pro_trial', 'trial', 'starter', 'pro',
        'professional', 'business', 'enterprise'
      ))
    `);

    console.log('✅ Tier constraint updated successfully');

    // Step 2: Get all admin users
    console.log('2️⃣ Finding admin users...');

    const adminUsersResult = await client.query(`
      SELECT id, username, email, "fullName", tier, role
      FROM users
      WHERE role = 'admin'
    `);

    console.log(`Found ${adminUsersResult.rows.length} admin users`);

    // Step 3: Update admin users to enterprise tier
    let updatedCount = 0;

    for (const admin of adminUsersResult.rows) {
      if (admin.tier !== 'enterprise') {
        console.log(`📈 Upgrading ${admin.fullName || admin.username} (${admin.email}) from ${admin.tier} to enterprise`);

        await client.query(
          'UPDATE users SET tier = $1 WHERE id = $2',
          ['enterprise', admin.id]
        );

        updatedCount++;
      } else {
        console.log(`✅ ${admin.fullName || admin.username} (${admin.email}) already has enterprise tier`);
      }
    }

    // Step 4: Verify updates
    console.log('3️⃣ Verifying updates...');

    const verifyResult = await client.query(`
      SELECT COUNT(*) as enterprise_admins
      FROM users
      WHERE role = 'admin' AND tier = 'enterprise'
    `);

    console.log(`✅ ${verifyResult.rows[0].enterprise_admins} admin users now have enterprise tier`);
    console.log(`📊 Updated ${updatedCount} admin accounts to enterprise tier`);

    console.log('🎉 Enterprise tier fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing enterprise tier:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
fixEnterpriseTier()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });