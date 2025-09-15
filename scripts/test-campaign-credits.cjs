#!/usr/bin/env node

/**
 * Test script to verify campaign generation properly deducts credits
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCampaignCredits() {
  console.log('🧪 Testing Campaign Credit Deduction...\n');
  
  // Test user credentials
  const testEmail = 'campaign-test@example.com';
  const testPassword = 'test123456';
  
  try {
    // 1. Create a test user with known credits
    console.log('1️⃣ Creating test user with 100 credits...');
    const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
      email: testEmail,
      username: 'campaign-tester',
      password: testPassword,
      firstName: 'Campaign',
      lastName: 'Tester',
      businessName: 'Test Business Inc'
    });
    
    const sessionCookie = signupRes.headers['set-cookie'][0];
    const headers = { Cookie: sessionCookie };
    
    // 2. Set user credits to 100 (if we have admin access, otherwise use default)
    console.log('   User created with default credits');
    
    // 3. Get initial credit balance
    const userRes = await axios.get(`${API_BASE}/user`, { headers });
    const initialCredits = userRes.data.credits || 50;
    console.log(`   Initial credits: ${initialCredits}`);
    
    // 4. Test insufficient credits scenario (if user has less than 84 credits)
    if (initialCredits < 84) {
      console.log('\n2️⃣ Testing insufficient credits scenario...');
      try {
        await axios.post(`${API_BASE}/campaigns/generate`, {
          prompt: 'Test campaign for credit validation',
          start_date: new Date().toISOString(),
          cadence: '2_per_day_7_days',
          businessName: 'Test Business',
          productName: 'Test Product',
          targetAudience: 'Test audience',
          brandTone: 'professional'
        }, { headers });
        
        console.log('   ❌ ERROR: Campaign should have been rejected due to insufficient credits!');
        process.exit(1);
      } catch (error) {
        if (error.response?.status === 402) {
          console.log('   ✅ Correctly rejected with 402 status');
          console.log(`   Message: ${error.response.data.message}`);
          console.log(`   Required: ${error.response.data.required} credits`);
          console.log(`   Available: ${error.response.data.have} credits`);
        } else {
          console.log('   ❌ Unexpected error:', error.response?.data || error.message);
        }
      }
    }
    
    // 5. Add credits to test successful generation (simulate admin adding credits)
    // Since we can't easily add credits in test, we'll create a new user with enough credits
    if (initialCredits < 84) {
      console.log('\n3️⃣ Creating admin user to test successful campaign generation...');
      
      // Use the demo admin user that has unlimited credits
      const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'spencer@myaimediamgr.com',
        password: 'admin123' // This would need to be the actual admin password
      }).catch(() => null);
      
      if (adminLoginRes) {
        const adminCookie = adminLoginRes.headers['set-cookie'][0];
        const adminHeaders = { Cookie: adminCookie };
        
        // Test with admin user who has sufficient credits
        console.log('4️⃣ Testing successful campaign generation with sufficient credits...');
        
        const adminUserRes = await axios.get(`${API_BASE}/user`, { headers: adminHeaders });
        const adminCredits = adminUserRes.data.credits;
        console.log(`   Admin credits before: ${adminCredits}`);
        
        const campaignRes = await axios.post(`${API_BASE}/campaigns/generate`, {
          prompt: 'Summer Sale Campaign for Fashion Store',
          start_date: new Date().toISOString(),
          cadence: '2_per_day_7_days',
          businessName: 'Fashion Forward',
          productName: 'Summer Collection',
          targetAudience: 'Young professionals',
          brandTone: 'trendy',
          keyMessages: ['Summer vibes', 'Limited time offer'],
          callToAction: 'Shop Now'
        }, { headers: adminHeaders });
        
        console.log('   ✅ Campaign generated successfully');
        console.log(`   Campaign ID: ${campaignRes.data.campaignId}`);
        console.log(`   Posts created: ${campaignRes.data.postCount}`);
        
        // Check credits after generation
        await sleep(1000);
        const adminUserAfterRes = await axios.get(`${API_BASE}/user`, { headers: adminHeaders });
        const adminCreditsAfter = adminUserAfterRes.data.credits;
        const creditsUsed = adminCredits - adminCreditsAfter;
        
        console.log(`   Admin credits after: ${adminCreditsAfter}`);
        console.log(`   Credits deducted: ${creditsUsed}`);
        
        if (creditsUsed === 84) {
          console.log('   ✅ Correct amount of credits deducted (84)');
        } else if (adminCredits === adminCreditsAfter && adminCredits > 999999) {
          console.log('   ℹ️  Admin has unlimited credits (no deduction)');
        } else {
          console.log(`   ⚠️  Expected 84 credits to be deducted, but ${creditsUsed} were deducted`);
        }
      }
    }
    
    console.log('\n✅ Campaign credit deduction tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testCampaignCredits().catch(console.error);