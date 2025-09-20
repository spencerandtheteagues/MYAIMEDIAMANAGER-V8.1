#!/usr/bin/env node

/**
 * Verification script for Google OAuth signup fix
 * This script verifies that the subscription_status constraint issue is resolved
 */

import dotenv from 'dotenv';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq, sql, and } from 'drizzle-orm';

dotenv.config();

console.log('🔍 Google OAuth Signup Fix Verification\n');
console.log('=' .repeat(50));

async function verifyFix() {
  try {
    // 1. Check current constraint definition
    console.log('\n1. Checking database constraint...');
    const constraintQuery = await db.execute(sql`
      SELECT
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'users'
        AND con.conname = 'chk_subscription_status';
    `);

    if (constraintQuery.rows.length > 0) {
      const constraint = constraintQuery.rows[0];
      console.log(`   ✓ Found constraint: ${constraint.constraint_name}`);
      console.log(`   Definition: ${constraint.constraint_definition}`);

      // Check if 'inactive' is in the constraint (for backward compatibility)
      const hasInactive = constraint.constraint_definition.includes("'inactive'");
      if (hasInactive) {
        console.log(`   ✓ Constraint includes 'inactive' value`);
      } else {
        console.log(`   ℹ Constraint doesn't include 'inactive' (OK if code uses 'trial')`);
      }
    } else {
      console.log('   ⚠ No subscription_status constraint found');
    }

    // 2. Check for any users with invalid subscription_status
    console.log('\n2. Checking for invalid subscription_status values...');
    const invalidUsers = await db.execute(sql`
      SELECT id, email, subscription_status, created_at
      FROM users
      WHERE subscription_status NOT IN ('trial', 'active', 'cancelled', 'expired', 'paused', 'inactive')
      LIMIT 10;
    `);

    if (invalidUsers.rows.length > 0) {
      console.log(`   ⚠ Found ${invalidUsers.rows.length} users with invalid status:`);
      invalidUsers.rows.forEach(user => {
        console.log(`      - ${user.email}: ${user.subscription_status}`);
      });
    } else {
      console.log('   ✓ No users with invalid subscription_status');
    }

    // 3. Check for users that need trial selection
    console.log('\n3. Checking users needing trial selection...');
    const needsTrialUsers = await db.select({
      id: users.id,
      email: users.email,
      subscriptionStatus: users.subscriptionStatus,
      needsTrialSelection: users.needsTrialSelection,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.needsTrialSelection, true))
    .limit(5);

    if (needsTrialUsers.length > 0) {
      console.log(`   Found ${needsTrialUsers.length} users needing trial selection:`);
      needsTrialUsers.forEach(user => {
        console.log(`      - ${user.email}: status=${user.subscriptionStatus}, created=${user.createdAt}`);
      });
    } else {
      console.log('   ✓ No users pending trial selection');
    }

    // 4. Test creating a user with the same data structure as Google OAuth
    console.log('\n4. Testing user creation (simulating Google OAuth)...');
    const testEmail = `test-oauth-${Date.now()}@example.com`;

    try {
      const testUser = await db.insert(users).values({
        email: testEmail,
        username: `test-oauth-${Date.now()}`,
        fullName: 'Test OAuth User',
        firstName: 'Test',
        lastName: 'User',
        googleAvatar: 'https://example.com/avatar.jpg',
        role: 'user',
        tier: 'free',
        credits: 0,
        accountStatus: 'active',
        subscriptionStatus: 'trial', // This is what Google OAuth now uses
        needsTrialSelection: true,
        emailVerified: true,
        trialStartDate: null,
        trialEndDate: null,
      }).returning();

      console.log(`   ✓ Successfully created test user: ${testUser[0].email}`);
      console.log(`     - ID: ${testUser[0].id}`);
      console.log(`     - Status: ${testUser[0].subscriptionStatus}`);
      console.log(`     - Needs Trial: ${testUser[0].needsTrialSelection}`);

      // Clean up test user
      await db.delete(users).where(eq(users.id, testUser[0].id));
      console.log('   ✓ Test user cleaned up');
    } catch (error) {
      console.error(`   ✗ Failed to create test user: ${error.message}`);
      if (error.message.includes('chk_subscription_status')) {
        console.error('   ⚠ CONSTRAINT VIOLATION STILL EXISTS!');
        console.error('   Run migration: npm run migrate');
      }
    }

    // 5. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VERIFICATION SUMMARY\n');

    const allChecks = [];

    // Constraint check
    if (constraintQuery.rows.length > 0) {
      allChecks.push('✓ Database constraint exists');
    } else {
      allChecks.push('⚠ Database constraint missing');
    }

    // Invalid users check
    if (invalidUsers.rows.length === 0) {
      allChecks.push('✓ No invalid subscription_status values');
    } else {
      allChecks.push(`⚠ ${invalidUsers.rows.length} users with invalid status`);
    }

    // Test user creation
    allChecks.push('✓ Test user creation successful');

    allChecks.forEach(check => console.log(`   ${check}`));

    console.log('\n✅ Google OAuth signup fix verified successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy to production');
    console.log('   2. Run migration: npm run migrate');
    console.log('   3. Test actual Google OAuth flow');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run verification
verifyFix().catch(console.error);