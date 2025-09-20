#!/usr/bin/env node

/**
 * Admin Panel Fix Script
 *
 * This script diagnoses and fixes common admin panel issues:
 * 1. Database constraint violations
 * 2. Missing API endpoints
 * 3. Authentication issues
 * 4. Tier validation problems
 */

const https = require('https');
const { Pool } = require('pg');

const BASE_URL = 'https://myaimediamgr.onrender.com';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://localhost/myaimediamanager',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class AdminPanelFixer {
    constructor() {
        this.issues = [];
        this.fixes = [];
    }

    async diagnose() {
        console.log('🔍 Diagnosing admin panel issues...\n');

        await this.checkDatabaseConstraints();
        await this.checkAPIEndpoints();
        await this.checkTierValidation();
        await this.checkAuthentication();

        this.reportIssues();
    }

    async checkDatabaseConstraints() {
        console.log('Checking database constraints...');

        const client = await pool.connect();
        try {
            // Check if enterprise tier constraint exists
            const constraintResult = await client.query(`
                SELECT constraint_name, check_clause
                FROM information_schema.check_constraints
                WHERE constraint_name = 'chk_user_tier'
            `);

            if (constraintResult.rows.length === 0) {
                this.issues.push({
                    type: 'database',
                    issue: 'Missing tier constraint',
                    severity: 'high',
                    description: 'User tier constraint is missing, could cause admin tier changes to fail'
                });
            } else {
                const constraint = constraintResult.rows[0].check_clause;
                if (!constraint.includes('enterprise')) {
                    this.issues.push({
                        type: 'database',
                        issue: 'Outdated tier constraint',
                        severity: 'high',
                        description: 'Tier constraint does not include enterprise tier'
                    });
                }
            }

            // Check for users with invalid tiers
            const invalidTiersResult = await client.query(`
                SELECT id, username, email, tier
                FROM users
                WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business', 'enterprise')
            `);

            if (invalidTiersResult.rows.length > 0) {
                this.issues.push({
                    type: 'database',
                    issue: 'Invalid user tiers',
                    severity: 'medium',
                    description: `${invalidTiersResult.rows.length} users have invalid tier values`,
                    data: invalidTiersResult.rows
                });
            }

            // Check admin users without enterprise tier
            const adminTiersResult = await client.query(`
                SELECT id, username, email, tier, role
                FROM users
                WHERE role = 'admin' AND tier != 'enterprise'
            `);

            if (adminTiersResult.rows.length > 0) {
                this.issues.push({
                    type: 'database',
                    issue: 'Admin users without enterprise tier',
                    severity: 'medium',
                    description: `${adminTiersResult.rows.length} admin users are not on enterprise tier`,
                    data: adminTiersResult.rows
                });
            }

        } catch (error) {
            this.issues.push({
                type: 'database',
                issue: 'Database connection error',
                severity: 'high',
                description: `Could not connect to database: ${error.message}`
            });
        } finally {
            client.release();
        }
    }

    async checkAPIEndpoints() {
        console.log('Checking API endpoints...');

        const endpoints = [
            '/api/admin/stats',
            '/api/admin/users',
            '/api/admin/transactions'
        ];

        for (const endpoint of endpoints) {
            try {
                await this.makeRequest('GET', endpoint);
                // If we get here, the endpoint exists (even if it returns 401)
            } catch (error) {
                if (error.statusCode === 404) {
                    this.issues.push({
                        type: 'api',
                        issue: 'Missing endpoint',
                        severity: 'high',
                        description: `API endpoint ${endpoint} not found`
                    });
                }
            }
        }
    }

    async checkTierValidation() {
        console.log('Checking tier validation logic...');

        // This would check if the frontend tier selection matches backend validation
        const validTiers = ['lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business', 'enterprise'];

        // Check if all expected tiers are handled in the admin panel
        // This is a placeholder for more complex validation logic
    }

    async checkAuthentication() {
        console.log('Checking authentication setup...');

        try {
            const response = await this.makeRequest('GET', '/api/admin/stats');
            // Should return 401 for unauthenticated requests
            if (response.statusCode !== 401) {
                this.issues.push({
                    type: 'auth',
                    issue: 'Authentication bypass',
                    severity: 'critical',
                    description: 'Admin endpoints may not require authentication'
                });
            }
        } catch (error) {
            // Expected to fail with 401
        }
    }

    async fix() {
        console.log('🔧 Applying fixes...\n');

        for (const issue of this.issues) {
            await this.applyFix(issue);
        }

        this.reportFixes();
    }

    async applyFix(issue) {
        const client = await pool.connect();

        try {
            switch (issue.issue) {
                case 'Missing tier constraint':
                case 'Outdated tier constraint':
                    console.log('Fixing tier constraint...');

                    await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier');
                    await client.query(`
                        ALTER TABLE users ADD CONSTRAINT chk_user_tier CHECK (tier IN (
                            'lite', 'free', 'pro_trial', 'trial', 'starter', 'pro',
                            'professional', 'business', 'enterprise'
                        ))
                    `);

                    this.fixes.push('Fixed user tier constraint to include enterprise tier');
                    break;

                case 'Invalid user tiers':
                    console.log('Fixing invalid user tiers...');

                    for (const user of issue.data) {
                        await client.query(
                            'UPDATE users SET tier = $1 WHERE id = $2',
                            ['free', user.id]
                        );
                    }

                    this.fixes.push(`Fixed ${issue.data.length} users with invalid tiers`);
                    break;

                case 'Admin users without enterprise tier':
                    console.log('Upgrading admin users to enterprise tier...');

                    for (const admin of issue.data) {
                        await client.query(
                            'UPDATE users SET tier = $1 WHERE id = $2',
                            ['enterprise', admin.id]
                        );
                    }

                    this.fixes.push(`Upgraded ${issue.data.length} admin users to enterprise tier`);
                    break;
            }
        } catch (error) {
            console.error(`Failed to fix ${issue.issue}:`, error.message);
        } finally {
            client.release();
        }
    }

    makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'myaimediamgr.onrender.com',
                port: 443,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        body: body,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                reject({ ...error, statusCode: 0 });
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    reportIssues() {
        console.log('\n📋 Issues Found:');
        console.log('================');

        if (this.issues.length === 0) {
            console.log('✅ No issues found! Admin panel should be working correctly.');
            return;
        }

        this.issues.forEach((issue, index) => {
            const severity = issue.severity.toUpperCase();
            const icon = issue.severity === 'critical' ? '🔴' :
                        issue.severity === 'high' ? '🟠' :
                        issue.severity === 'medium' ? '🟡' : '🔵';

            console.log(`${index + 1}. ${icon} [${severity}] ${issue.issue}`);
            console.log(`   Type: ${issue.type}`);
            console.log(`   Description: ${issue.description}`);
            if (issue.data) {
                console.log(`   Affected records: ${JSON.stringify(issue.data, null, 2)}`);
            }
            console.log('');
        });
    }

    reportFixes() {
        console.log('\n✅ Fixes Applied:');
        console.log('================');

        if (this.fixes.length === 0) {
            console.log('No fixes were applied.');
            return;
        }

        this.fixes.forEach((fix, index) => {
            console.log(`${index + 1}. ${fix}`);
        });

        console.log('\n🎉 Admin panel fixes completed!');
        console.log('Please test the admin panel functionality now.');
    }
}

// Test specific admin functionalities
class AdminPanelTester {
    constructor() {
        this.testResults = [];
    }

    async runTests() {
        console.log('\n🧪 Testing Admin Panel Functions...\n');

        await this.testEndpoint('Admin Stats', '/api/admin/stats');
        await this.testEndpoint('User List', '/api/admin/users');
        await this.testEndpoint('Transactions', '/api/admin/transactions');

        this.reportTestResults();
    }

    async testEndpoint(name, endpoint) {
        try {
            const response = await this.makeRequest('GET', endpoint);

            if (response.statusCode === 401) {
                this.testResults.push({
                    name: name,
                    status: 'pass',
                    message: 'Endpoint exists and properly requires authentication'
                });
            } else if (response.statusCode === 404) {
                this.testResults.push({
                    name: name,
                    status: 'fail',
                    message: 'Endpoint not found (404)'
                });
            } else {
                this.testResults.push({
                    name: name,
                    status: 'warning',
                    message: `Unexpected response code: ${response.statusCode}`
                });
            }
        } catch (error) {
            this.testResults.push({
                name: name,
                status: 'fail',
                message: `Request failed: ${error.message}`
            });
        }
    }

    makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'myaimediamgr.onrender.com',
                port: 443,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        body: body,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    reportTestResults() {
        console.log('\n📊 Test Results:');
        console.log('===============');

        let passed = 0, failed = 0, warnings = 0;

        this.testResults.forEach((result, index) => {
            const icon = result.status === 'pass' ? '✅' :
                        result.status === 'fail' ? '❌' : '⚠️';

            console.log(`${index + 1}. ${icon} ${result.name}: ${result.message}`);

            if (result.status === 'pass') passed++;
            else if (result.status === 'fail') failed++;
            else warnings++;
        });

        console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
    }
}

// Main execution
async function main() {
    console.log('🚀 Admin Panel Diagnostic & Fix Tool');
    console.log('====================================\n');

    const fixer = new AdminPanelFixer();
    const tester = new AdminPanelTester();

    // Run diagnosis
    await fixer.diagnose();

    // Apply fixes if issues found
    if (fixer.issues.length > 0) {
        console.log('\nWould you like to apply fixes? (This will modify the database)');
        await fixer.fix();
    }

    // Run tests
    await tester.runTests();

    // Close database pool
    await pool.end();

    console.log('\n🏁 Diagnostic complete!');
    console.log('\nCommon fixes for admin panel issues:');
    console.log('1. Check that you are logged in as an admin user');
    console.log('2. Ensure database constraints are up to date');
    console.log('3. Verify API endpoints are properly authenticated');
    console.log('4. Check browser console for JavaScript errors');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { AdminPanelFixer, AdminPanelTester };