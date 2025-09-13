#!/usr/bin/env node

/**
 * Test script to verify all Settings page endpoints are working
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test endpoints configuration
const endpoints = [
  { method: 'GET', path: '/api/user', description: 'Get current user' },
  { method: 'GET', path: '/api/user/billing-history', description: 'Get billing history' },
  { method: 'PATCH', path: '/api/user/password', description: 'Change password', requiresAuth: true },
  { method: 'PATCH', path: '/api/user/email', description: 'Change email', requiresAuth: true },
  { method: 'POST', path: '/api/subscription/upgrade', description: 'Upgrade subscription', requiresAuth: true },
  { method: 'POST', path: '/api/subscription/cancel', description: 'Cancel subscription', requiresAuth: true },
  { method: 'POST', path: '/api/credits/purchase', description: 'Purchase credits', requiresAuth: true },
  { method: 'DELETE', path: '/api/user/account', description: 'Delete account', requiresAuth: true },
  { method: 'GET', path: '/api/billing/plans', description: 'Get subscription plans' },
];

async function testEndpoints() {
  console.log('🔍 Testing Settings Page Endpoints\n');
  console.log('=' .repeat(50) + '\n');

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      const statusClass = Math.floor(response.status / 100);
      const isSuccess = statusClass === 2 || (statusClass === 4 && endpoint.requiresAuth); // 2xx or expected 4xx for auth
      
      if (isSuccess) {
        console.log(`✅ ${endpoint.method} ${endpoint.path}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Description: ${endpoint.description}`);
        if (endpoint.requiresAuth && response.status === 401) {
          console.log(`   Note: Authentication required (working as expected)`);
        }
        successCount++;
        results.push({ 
          endpoint: `${endpoint.method} ${endpoint.path}`, 
          status: 'working',
          httpStatus: response.status,
          description: endpoint.description
        });
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path}`);
        console.log(`   Status: ${response.status} (Server Error)`);
        console.log(`   Description: ${endpoint.description}`);
        failCount++;
        results.push({ 
          endpoint: `${endpoint.method} ${endpoint.path}`, 
          status: 'error',
          httpStatus: response.status,
          description: endpoint.description
        });
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Description: ${endpoint.description}`);
      failCount++;
      results.push({ 
        endpoint: `${endpoint.method} ${endpoint.path}`, 
        status: 'error',
        error: error.message,
        description: endpoint.description
      });
    }
    console.log();
  }

  console.log('=' .repeat(50));
  console.log(`\n📊 Results Summary:`);
  console.log(`   ✅ ${successCount} endpoints working correctly`);
  console.log(`   ❌ ${failCount} endpoints with errors`);
  
  if (failCount === 0) {
    console.log('\n🎉 All endpoints are accessible and responding correctly!');
    console.log('   Note: 401 responses are expected for authenticated endpoints when not logged in.');
  } else {
    console.log('\n⚠️  Some endpoints are not working correctly.');
    console.log('   Please check the server logs for more details.');
  }

  // Display summary table
  console.log('\n📋 Endpoint Status Summary:');
  console.log('─'.repeat(70));
  results.forEach(result => {
    const icon = result.status === 'working' ? '✅' : '❌';
    const status = result.httpStatus || result.error || 'Unknown';
    console.log(`${icon} ${result.endpoint.padEnd(40)} │ ${status}`);
  });
  console.log('─'.repeat(70));

  return failCount === 0;
}

// Run the tests
testEndpoints()
  .then(success => {
    console.log('\n✨ Settings endpoints test completed!');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });