#!/usr/bin/env node
/**
 * Emergency tier fix for production database
 * Fixes all invalid tier values before deployment
 */

require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function emergencyTierFix() {
  console.log('🚨 EMERGENCY TIER FIX - Production Database');
  console.log('==========================================\n');

  try {
    // Test connection first
    console.log('1. Testing database connection...');
    const testResult = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    console.log(`   ✅ Connected! ${testResult.rows[0].user_count} users in database`);
    console.log(`   📅 Server time: ${testResult.rows[0].current_time}\n`);

    // Drop existing constraint
    console.log('2. Removing existing tier constraint...');
    try {
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier');
      console.log('   ✅ Constraint removed or didn\'t exist\n');
    } catch (error) {
      console.log(`   ⚠️  Issue dropping constraint: ${error.message}\n`);
    }

    // Show current problematic data
    console.log('3. Analyzing current tier values...');
    const currentTiers = await pool.query(`
      SELECT
        COALESCE(tier, 'NULL') as tier_value,
        COUNT(*) as count,
        CASE
          WHEN tier IS NULL OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
          THEN '❌ INVALID'
          ELSE '✅ VALID'
        END as status
      FROM users
      GROUP BY tier
      ORDER BY count DESC
    `);

    console.log('   Current distribution:');
    let totalInvalid = 0;
    for (const row of currentTiers.rows) {
      console.log(`   ${row.status} ${row.tier_value}: ${row.count} users`);
      if (row.status === '❌ INVALID') {
        totalInvalid += parseInt(row.count);
      }
    }
    console.log(`\n   Total invalid: ${totalInvalid} users need fixing\n`);

    if (totalInvalid === 0) {
      console.log('🎉 All tier values are already valid! Deployment should work now.\n');
      await pool.end();
      process.exit(0);
    }

    // Fix all invalid values
    console.log('4. Applying fixes...');
    let totalFixed = 0;

    // Fix NULLs to 'free'
    const nullResult = await pool.query(`
      UPDATE users
      SET tier = 'free'
      WHERE tier IS NULL
    `);
    if (nullResult.rowCount > 0) {
      console.log(`   - Fixed ${nullResult.rowCount} NULL values → 'free'`);
      totalFixed += nullResult.rowCount;
    }

    // Fix common variants
    const fixes = [
      { pattern: 'free_trial', target: 'free', description: 'free_trial → free' },
      { pattern: 'freetrial', target: 'free', description: 'freetrial → free' },
      { pattern: 'protrial', target: 'pro_trial', description: 'protrial → pro_trial' },
      { pattern: 'pro-trial', target: 'pro_trial', description: 'pro-trial → pro_trial' },
      { pattern: 'enterprise', target: 'business', description: 'enterprise → business' },
      { pattern: 'team', target: 'business', description: 'team → business' },
      { pattern: 'agency', target: 'business', description: 'agency → business' },
      { pattern: 'basic', target: 'starter', description: 'basic → starter' },
      { pattern: 'pay_as_you_go', target: 'starter', description: 'pay_as_you_go → starter' },
      { pattern: 'pay-as-you-go', target: 'starter', description: 'pay-as-you-go → starter' },
      { pattern: 'payg', target: 'starter', description: 'payg → starter' },
      { pattern: 'premium', target: 'professional', description: 'premium → professional' }
    ];

    for (const fix of fixes) {
      const result = await pool.query(`
        UPDATE users
        SET tier = $1
        WHERE LOWER(tier) = LOWER($2)
      `, [fix.target, fix.pattern]);

      if (result.rowCount > 0) {
        console.log(`   - Fixed ${result.rowCount} users: ${fix.description}`);
        totalFixed += result.rowCount;
      }
    }

    // Catch all remaining invalid values
    const remainingResult = await pool.query(`
      UPDATE users
      SET tier = 'free'
      WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
    `);
    if (remainingResult.rowCount > 0) {
      console.log(`   - Fixed ${remainingResult.rowCount} other invalid values → 'free'`);
      totalFixed += remainingResult.rowCount;
    }

    console.log(`\n   Total fixed: ${totalFixed} users\n`);

    // Verify all are now valid
    console.log('5. Final verification...');
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as invalid_count
      FROM users
      WHERE tier IS NULL
         OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
    `);

    const stillInvalid = parseInt(verifyResult.rows[0].invalid_count);
    if (stillInvalid > 0) {
      console.error(`   ❌ CRITICAL: ${stillInvalid} users still have invalid tiers!`);

      // Show what's still invalid
      const stillBadResult = await pool.query(`
        SELECT tier, COUNT(*) as count
        FROM users
        WHERE tier IS NULL OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
        GROUP BY tier
      `);

      console.error('   Still invalid:');
      for (const row of stillBadResult.rows) {
        console.error(`     - "${row.tier || 'NULL'}": ${row.count} users`);
      }

      await pool.end();
      process.exit(1);
    }

    console.log('   ✅ ALL TIERS ARE NOW VALID!\n');

    // Show final distribution
    console.log('6. Final tier distribution:');
    const finalDistribution = await pool.query(`
      SELECT tier, COUNT(*) as count
      FROM users
      GROUP BY tier
      ORDER BY count DESC
    `);

    for (const row of finalDistribution.rows) {
      console.log(`   ✅ ${row.tier}: ${row.count} users`);
    }

    console.log('\n🎉 SUCCESS! Database is ready for deployment!');
    console.log('💡 You can now trigger a new deployment - it should succeed.\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not found!');
  console.error('Please set your database connection string in .env file or environment');
  process.exit(1);
}

// Run the emergency fix
emergencyTierFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});