#!/usr/bin/env node
/**
 * Direct database fix using production DATABASE_URL
 * This connects directly to the Neon database and fixes tier issues
 */

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Production DATABASE_URL (from Render environment variables)
const DATABASE_URL = "postgresql://neondb_owner:npg_EKlUVWFo2RD8@ep-dawn-hill-ad4ptzz8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function directDatabaseFix() {
  console.log('🔧 DIRECT DATABASE FIX - Production Neon Database');
  console.log('================================================\n');

  try {
    // Test connection first
    console.log('1. Testing database connection...');
    const testResult = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log(`   ✅ Connected successfully!`);
    console.log(`   📅 Server time: ${testResult.rows[0].current_time}`);
    console.log(`   🗄️  Database: ${testResult.rows[0].db_version}\n`);

    // Check if users table exists
    console.log('2. Checking users table...');
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as user_count
      FROM users
    `);
    console.log(`   ✅ Users table found with ${tableCheck.rows[0].user_count} users\n`);

    // Show current tier distribution
    console.log('3. Current tier distribution:');
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

    let totalInvalid = 0;
    for (const row of currentTiers.rows) {
      console.log(`   ${row.status} ${row.tier_value}: ${row.count} users`);
      if (row.status === '❌ INVALID') {
        totalInvalid += parseInt(row.count);
      }
    }
    console.log(`\n   📊 Total invalid: ${totalInvalid} users need fixing\n`);

    if (totalInvalid === 0) {
      console.log('🎉 All tier values are already valid! Database is clean.\n');
      await pool.end();
      return;
    }

    // Drop existing constraint to prevent issues
    console.log('4. Removing tier constraint (if exists)...');
    try {
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier');
      console.log('   ✅ Constraint removed or didn\'t exist\n');
    } catch (error) {
      console.log(`   ⚠️  Note: ${error.message}\n`);
    }

    // Fix all invalid values step by step
    console.log('5. Fixing invalid tier values...');
    let totalFixed = 0;

    // Fix NULLs to 'free'
    const nullResult = await pool.query(`
      UPDATE users
      SET tier = 'free'
      WHERE tier IS NULL
    `);
    if (nullResult.rowCount > 0) {
      console.log(`   ✓ Fixed ${nullResult.rowCount} NULL values → 'free'`);
      totalFixed += nullResult.rowCount;
    }

    // Fix specific invalid values
    const fixes = [
      ['free_trial', 'free'],
      ['freetrial', 'free'],
      ['protrial', 'pro_trial'],
      ['pro-trial', 'pro_trial'],
      ['enterprise', 'business'],
      ['team', 'business'],
      ['agency', 'business'],
      ['basic', 'starter'],
      ['pay_as_you_go', 'starter'],
      ['pay-as-you-go', 'starter'],
      ['payg', 'starter'],
      ['premium', 'professional']
    ];

    for (const [from, to] of fixes) {
      const result = await pool.query(`
        UPDATE users
        SET tier = $1
        WHERE LOWER(tier) = LOWER($2)
      `, [to, from]);

      if (result.rowCount > 0) {
        console.log(`   ✓ Fixed ${result.rowCount} users: '${from}' → '${to}'`);
        totalFixed += result.rowCount;
      }
    }

    // Catch-all for any remaining invalid values
    const catchAllResult = await pool.query(`
      UPDATE users
      SET tier = 'free'
      WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
    `);
    if (catchAllResult.rowCount > 0) {
      console.log(`   ✓ Fixed ${catchAllResult.rowCount} other invalid values → 'free'`);
      totalFixed += catchAllResult.rowCount;
    }

    console.log(`\n   📈 Total fixed: ${totalFixed} users\n`);

    // Final verification
    console.log('6. Final verification...');
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as invalid_count
      FROM users
      WHERE tier IS NULL
         OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
    `);

    const stillInvalid = parseInt(verifyResult.rows[0].invalid_count);
    if (stillInvalid > 0) {
      console.error(`   ❌ CRITICAL: ${stillInvalid} users still have invalid tiers!`);

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
    } else {
      console.log('   ✅ ALL TIERS ARE NOW VALID!\n');
    }

    // Show final distribution
    console.log('7. Final tier distribution:');
    const finalDistribution = await pool.query(`
      SELECT tier, COUNT(*) as count
      FROM users
      GROUP BY tier
      ORDER BY count DESC
    `);

    for (const row of finalDistribution.rows) {
      console.log(`   ✅ ${row.tier}: ${row.count} users`);
    }

    if (stillInvalid === 0) {
      console.log('\n🎉 SUCCESS! Database is now clean and ready for deployment!');
      console.log('💡 The constraint migration should now succeed.\n');
    } else {
      console.log('\n⚠️  Some issues remain. Check the invalid values above.\n');
    }

    await pool.end();

  } catch (error) {
    console.error('\n💥 ERROR connecting to or fixing database:', error.message);
    console.error('Stack trace:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

// Run the direct database fix
console.log('Starting direct database fix...\n');
directDatabaseFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});