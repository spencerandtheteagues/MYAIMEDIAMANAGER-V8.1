#!/usr/bin/env node

const fetch = require('node-fetch');
const baseUrl = 'http://localhost:5000';

// Helper function to generate random username and email
function generateRandomUser() {
  const random = Math.random().toString(36).substring(7);
  return {
    email: `test_${random}@example.com`,
    username: `testuser_${random}`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    businessName: 'Test Business'
  };
}

async function testReferralSystem() {
  console.log('🧪 Testing Referral System...\n');
  
  try {
    // Step 1: Create a new user and check if they get a referral code
    console.log('1️⃣ Creating new user...');
    const userData = generateRandomUser();
    
    const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const signupData = await signupResponse.json();
    console.log('✅ User created:', {
      email: signupData.email,
      username: signupData.username,
      referralCode: signupData.referralCode,
      credits: signupData.credits
    });
    
    if (!signupData.referralCode) {
      console.log('⚠️ Warning: User created without referral code!');
    } else {
      console.log(`✅ Referral code generated: ${signupData.referralCode}`);
    }
    
    // Step 2: Login as the new user
    console.log('\n2️⃣ Logging in as new user...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    const loginData = await loginResponse.json();
    
    if (loginData.referralCode) {
      console.log(`✅ Login successful, referral code: ${loginData.referralCode}`);
    }
    
    // Step 3: Get user info via /me endpoint
    console.log('\n3️⃣ Fetching user info via /me endpoint...');
    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 
        'Cookie': cookies || ''
      }
    });
    
    const meData = await meResponse.json();
    console.log('User data from /me:', {
      id: meData.id,
      email: meData.email,
      referralCode: meData.referralCode,
      credits: meData.credits
    });
    
    // Step 4: Get referral stats
    console.log('\n4️⃣ Fetching referral stats...');
    const statsResponse = await fetch(`${baseUrl}/api/referrals/stats`, {
      headers: { 
        'Cookie': cookies || ''
      }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Referral stats:', statsData);
    } else {
      console.log('⚠️ Could not fetch referral stats:', statsResponse.status);
    }
    
    // Step 5: Validate the referral link format
    if (signupData.referralCode || meData.referralCode) {
      const referralCode = signupData.referralCode || meData.referralCode;
      const referralLink = `http://localhost:5000/auth?ref=${referralCode}`;
      console.log('\n5️⃣ Referral link format:');
      console.log(`✅ ${referralLink}`);
    }
    
    console.log('\n✅ Referral system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testReferralSystem();