#!/usr/bin/env node
/**
 * Pre-deployment script for Render
 * Ensures database is ready before applying constraints
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixTiers() {
  console.log('🔧 Pre-deployment database fixes...\n');

  try {
    // Step 1: Drop existing constraint if exists
    console.log('1. Dropping existing tier constraint (if exists)...');
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier`);
    console.log('   ✅ Constraint dropped or didn\'t exist\n');

    // Step 2: Show current problematic data
    console.log('2. Checking for invalid tier values...');
    const problemData = await pool.query(`
      SELECT tier, COUNT(*) as count
      FROM users
      WHERE tier IS NULL
         OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
      GROUP BY tier
      ORDER BY count DESC
    `);

    if (problemData.rows.length > 0) {
      console.log('   ⚠️  Found invalid values:');
      for (const row of problemData.rows) {
        console.log(`      - "${row.tier || 'NULL'}": ${row.count} users`);
      }
      console.log('');
    } else {
      console.log('   ✅ All tier values are already valid!\n');
      await pool.end();
      process.exit(0);
    }

    // Step 3: Fix all invalid values
    console.log('3. Fixing invalid tier values...');

    // Fix NULLs
    const nullResult = await pool.query(`UPDATE users SET tier = 'free' WHERE tier IS NULL`);
    if (nullResult.rowCount > 0) {
      console.log(`   - Fixed ${nullResult.rowCount} NULL values`);
    }

    // Fix common invalid values
    const mappings = [
      { from: ['free_trial', 'freetrial'], to: 'free' },
      { from: ['protrial', 'pro-trial'], to: 'pro_trial' },
      { from: ['enterprise', 'team', 'agency'], to: 'business' },
      { from: ['basic', 'pay_as_you_go', 'pay-as-you-go', 'payg'], to: 'starter' },
      { from: ['premium'], to: 'professional' }
    ];

    for (const mapping of mappings) {
      const query = `UPDATE users SET tier = $1 WHERE LOWER(tier) = ANY($2::text[])`;
      const result = await pool.query(query, [mapping.to, mapping.from]);
      if (result.rowCount > 0) {
        console.log(`   - Mapped ${result.rowCount} "${mapping.from.join('/')}' → "${mapping.to}"`);
      }
    }

    // Fix any remaining invalid values
    const catchAllResult = await pool.query(`
      UPDATE users
      SET tier = 'free'
      WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
    `);
    if (catchAllResult.rowCount > 0) {
      console.log(`   - Fixed ${catchAllResult.rowCount} other invalid values → "free"`);
    }

    console.log('');

    // Step 4: Verify all fixed
    console.log('4. Verifying all tiers are now valid...');
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as invalid_count
      FROM users
      WHERE tier IS NULL
         OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
    `);

    const invalidCount = verifyResult.rows[0].invalid_count;
    if (invalidCount > 0) {
      console.error(`   ❌ FAILED: ${invalidCount} users still have invalid tier values!`);
      await pool.end();
      process.exit(1);
    }

    console.log('   ✅ All tiers are now valid!\n');

    // Step 5: Show final distribution
    console.log('5. Final tier distribution:');
    const distribution = await pool.query(`
      SELECT tier, COUNT(*) as count
      FROM users
      GROUP BY tier
      ORDER BY count DESC
    `);

    for (const row of distribution.rows) {
      console.log(`   - ${row.tier}: ${row.count} users`);
    }

    console.log('\n✨ Database is ready for constraints!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during pre-deployment fixes:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run the fixes
fixTiers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});