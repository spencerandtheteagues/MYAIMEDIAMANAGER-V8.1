#!/usr/bin/env node

/**
 * Quick Admin Panel Issue Fixer
 *
 * This script fixes the most common admin panel issues without requiring complex diagnostics.
 * Run this script to quickly resolve database constraint issues and admin tier problems.
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixAdminIssues() {
    console.log('🔧 Admin Panel Quick Fix Started\n');

    const client = await pool.connect();

    try {
        // 1. Fix tier constraint to include enterprise
        console.log('1. Fixing tier constraint...');

        await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier');
        await client.query(`
            ALTER TABLE users ADD CONSTRAINT chk_user_tier CHECK (tier IN (
                'lite', 'free', 'pro_trial', 'trial', 'starter', 'pro',
                'professional', 'business', 'enterprise'
            ))
        `);
        console.log('   ✅ Tier constraint updated');

        // 2. Fix subscription status constraint
        console.log('2. Fixing subscription status constraint...');

        await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_subscription_status');
        await client.query(`
            ALTER TABLE users ADD CONSTRAINT chk_subscription_status CHECK (
                "subscriptionStatus" IN ('trial', 'active', 'cancelled', 'inactive', 'past_due')
            )
        `);
        console.log('   ✅ Subscription status constraint updated');

        // 3. Upgrade all admin users to enterprise tier
        console.log('3. Upgrading admin users to enterprise tier...');

        const adminUsers = await client.query(`
            SELECT id, username, email, "fullName", tier
            FROM users
            WHERE role = 'admin' AND tier != 'enterprise'
        `);

        if (adminUsers.rows.length > 0) {
            await client.query(`
                UPDATE users
                SET tier = 'enterprise', "updatedAt" = NOW()
                WHERE role = 'admin' AND tier != 'enterprise'
            `);

            console.log(`   ✅ Upgraded ${adminUsers.rows.length} admin users to enterprise tier:`);
            adminUsers.rows.forEach(user => {
                console.log(`     - ${user.fullName || user.username} (${user.email}): ${user.tier} → enterprise`);
            });
        } else {
            console.log('   ✅ All admin users already have enterprise tier');
        }

        // 4. Fix users with invalid tiers
        console.log('4. Fixing users with invalid tiers...');

        const invalidUsers = await client.query(`
            SELECT id, username, email, tier
            FROM users
            WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business', 'enterprise')
        `);

        if (invalidUsers.rows.length > 0) {
            await client.query(`
                UPDATE users
                SET tier = 'free', "updatedAt" = NOW()
                WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business', 'enterprise')
            `);

            console.log(`   ✅ Fixed ${invalidUsers.rows.length} users with invalid tiers (set to 'free')`);
        } else {
            console.log('   ✅ All users have valid tiers');
        }

        // 5. Fix users with invalid subscription statuses
        console.log('5. Fixing users with invalid subscription statuses...');

        const invalidSubscriptions = await client.query(`
            SELECT id, username, email, "subscriptionStatus"
            FROM users
            WHERE "subscriptionStatus" NOT IN ('trial', 'active', 'cancelled', 'inactive', 'past_due')
        `);

        if (invalidSubscriptions.rows.length > 0) {
            await client.query(`
                UPDATE users
                SET "subscriptionStatus" = 'inactive', "updatedAt" = NOW()
                WHERE "subscriptionStatus" NOT IN ('trial', 'active', 'cancelled', 'inactive', 'past_due')
            `);

            console.log(`   ✅ Fixed ${invalidSubscriptions.rows.length} users with invalid subscription statuses`);
        } else {
            console.log('   ✅ All users have valid subscription statuses');
        }

        // 6. Ensure all admin users have proper permissions
        console.log('6. Ensuring admin users have proper permissions...');

        await client.query(`
            UPDATE users
            SET "isAdmin" = true, "emailVerified" = true, "updatedAt" = NOW()
            WHERE role = 'admin' AND ("isAdmin" = false OR "emailVerified" = false)
        `);
        console.log('   ✅ Admin permissions synchronized');

        // 7. Show summary
        console.log('\n📊 Summary:');

        const totalUsers = await client.query('SELECT COUNT(*) as count FROM users');
        const adminCount = await client.query('SELECT COUNT(*) as count FROM users WHERE role = \'admin\'');
        const enterpriseAdmins = await client.query('SELECT COUNT(*) as count FROM users WHERE role = \'admin\' AND tier = \'enterprise\'');

        console.log(`   Total users: ${totalUsers.rows[0].count}`);
        console.log(`   Admin users: ${adminCount.rows[0].count}`);
        console.log(`   Enterprise admins: ${enterpriseAdmins.rows[0].count}`);

        // 8. Create test admin action log entry
        try {
            await client.query(`
                INSERT INTO admin_actions ("id", "adminUserId", "targetUserId", "action", "details", "createdAt")
                VALUES ($1, NULL, NULL, 'admin_panel_fix', $2, NOW())
            `, [crypto.randomUUID(), JSON.stringify({
                description: 'Auto-fixed admin panel database constraints',
                fixedUsers: adminUsers.rows.length + invalidUsers.rows.length + invalidSubscriptions.rows.length
            })]);
            console.log('   ✅ Logged admin action');
        } catch (error) {
            console.log('   ⚠️ Could not log admin action (table may not exist)');
        }

        console.log('\n🎉 Admin panel fixes completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Test admin panel login');
        console.log('2. Try editing a user');
        console.log('3. Test password reset functionality');
        console.log('4. Test trial management');

    } catch (error) {
        console.error('❌ Error fixing admin issues:', error.message);
        console.error('\nThis might help:');
        console.error('- Check database connection');
        console.error('- Ensure you have admin privileges');
        console.error('- Try running migrations first');
    } finally {
        client.release();
        await pool.end();
    }
}

// Additional utility functions
async function testAdminEndpoints() {
    console.log('\n🧪 Testing admin endpoints...');

    const https = require('https');

    const testEndpoint = (path) => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'myaimediamgr.onrender.com',
                port: 443,
                path: path,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            };

            const req = https.request(options, (res) => {
                resolve({
                    status: res.statusCode,
                    path: path
                });
            });

            req.on('error', (error) => {
                reject({ path, error: error.message });
            });

            req.setTimeout(5000, () => {
                req.abort();
                reject({ path, error: 'Timeout' });
            });

            req.end();
        });
    };

    const endpoints = [
        '/api/admin/stats',
        '/api/admin/users',
        '/api/admin/transactions'
    ];

    for (const endpoint of endpoints) {
        try {
            const result = await testEndpoint(endpoint);
            const status = result.status === 401 ? '✅ Protected' :
                          result.status === 404 ? '❌ Not found' :
                          `⚠️ Status: ${result.status}`;
            console.log(`   ${endpoint}: ${status}`);
        } catch (error) {
            console.log(`   ${endpoint}: ❌ Error: ${error.error}`);
        }
    }
}

if (require.main === module) {
    fixAdminIssues()
        .then(() => testAdminEndpoints())
        .catch(console.error);
}

module.exports = { fixAdminIssues, testAdminEndpoints };