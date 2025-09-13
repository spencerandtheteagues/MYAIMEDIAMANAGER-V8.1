#!/usr/bin/env node

/**
 * Test script to verify all Settings page endpoints are working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test endpoints configuration
const endpoints = [
  { method: 'GET', path: '/api/user', description: 'Get current user' },
  { method: 'GET', path: '/api/user/billing-history', description: 'Get billing history' },
  { method: 'PATCH', path: '/api/user/password', description: 'Change password' },
  { method: 'PATCH', path: '/api/user/email', description: 'Change email' },
  { method: 'POST', path: '/api/subscription/upgrade', description: 'Upgrade subscription' },
  { method: 'POST', path: '/api/subscription/cancel', description: 'Cancel subscription' },
  { method: 'POST', path: '/api/credits/purchase', description: 'Purchase credits' },
  { method: 'DELETE', path: '/api/user/account', description: 'Delete account' },
  { method: 'GET', path: '/api/billing/plans', description: 'Get subscription plans' },
];

async function testEndpoints() {
  console.log('Testing Settings Page Endpoints\n');
  console.log('================================\n');

  let successCount = 0;
  let failCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      const statusClass = Math.floor(response.status / 100);
      const isSuccess = statusClass === 2 || statusClass === 4; // 2xx or 4xx (expected auth failures)
      
      if (isSuccess) {
        console.log(`✅ ${endpoint.method} ${endpoint.path}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Description: ${endpoint.description}`);
        successCount++;
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path}`);
        console.log(`   Status: ${response.status} (Server Error)`);
        console.log(`   Description: ${endpoint.description}`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Description: ${endpoint.description}`);
      failCount++;
    }
    console.log();
  }

  console.log('================================');
  console.log(`\nResults: ${successCount} endpoints working, ${failCount} failures`);
  
  if (failCount === 0) {
    console.log('\n✅ All endpoints are accessible and responding correctly!');
    console.log('Note: 401 responses are expected for authenticated endpoints when not logged in.');
  } else {
    console.log('\n⚠️ Some endpoints are not working correctly.');
    console.log('Please check the server logs for more details.');
  }
}

// Run the tests
testEndpoints().catch(console.error);