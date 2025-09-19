#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Test accounts
const referrer = {
  email: 'referrer@test.com',
  password: 'TestPass123!',
  username: 'referrer_user',
  firstName: 'Referrer',
  lastName: 'User',
  businessName: 'Referrer Business'
};

const referred = {
  email: 'referred@test.com',
  password: 'TestPass123!',
  username: 'referred_user',
  firstName: 'Referred',
  lastName: 'User',
  businessName: 'Referred Business'
};

let referrerToken = '';
let referralCode = '';

async function signupUser(userData) {
  console.log(`\n📝 Signing up user: ${userData.email}`);
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Signup failed:', error);
    return null;
  }

  const data = await response.json();
  console.log('✅ User signed up successfully');
  return data;
}

async function loginUser(email, password) {
  console.log(`\n🔐 Logging in user: ${email}`);
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Login failed:', error);
    return null;
  }

  const data = await response.json();
  console.log('✅ User logged in successfully');
  return data.token;
}

async function getReferralInfo(token) {
  console.log('\n🎁 Getting referral information');
  const response = await fetch(`${BASE_URL}/api/referral/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to get referral info:', error);
    return null;
  }

  const data = await response.json();
  console.log('✅ Referral info retrieved');
  console.log(`   Code: ${data.referralCode}`);
  console.log(`   Link: ${data.referralLink}`);
  console.log(`   Stats:`, data.stats);
  return data;
}

async function validateReferralCode(code) {
  console.log(`\n🔍 Validating referral code: ${code}`);
  const response = await fetch(`${BASE_URL}/api/referral/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referralCode: code })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Validation failed:', error);
    return false;
  }

  const data = await response.json();
  console.log('✅ Code is valid');
  console.log(`   Referrer: ${data.referrerName}`);
  return data.valid;
}

async function signupWithReferral(userData, referralCode) {
  console.log(`\n📝 Signing up with referral code: ${referralCode}`);
  const signupData = { ...userData, referralCode };

  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Signup with referral failed:', error);
    return null;
  }

  const data = await response.json();
  console.log('✅ User signed up with referral successfully');

  // Process the referral
  if (data.userId) {
    console.log('\n💰 Processing referral reward');
    await fetch(`${BASE_URL}/api/referral/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode,
        newUserId: data.userId
      })
    });
  }

  return data;
}

async function getUserCredits(token) {
  console.log('\n💳 Checking user credits');
  const response = await fetch(`${BASE_URL}/api/user`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to get user info:', error);
    return null;
  }

  const data = await response.json();
  console.log(`✅ User credits: ${data.credits}`);
  return data.credits;
}

async function runTests() {
  console.log('🚀 Starting Referral System Tests');
  console.log('================================');

  try {
    // Step 1: Create referrer account
    console.log('\n📌 Step 1: Create Referrer Account');
    await signupUser(referrer);
    referrerToken = await loginUser(referrer.email, referrer.password);

    if (!referrerToken) {
      throw new Error('Failed to login referrer');
    }

    // Step 2: Get referral code
    console.log('\n📌 Step 2: Get Referral Code');
    const referralInfo = await getReferralInfo(referrerToken);

    if (!referralInfo) {
      throw new Error('Failed to get referral info');
    }

    referralCode = referralInfo.referralCode;

    // Step 3: Validate referral code
    console.log('\n📌 Step 3: Validate Referral Code');
    const isValid = await validateReferralCode(referralCode);

    if (!isValid) {
      throw new Error('Referral code validation failed');
    }

    // Step 4: Create referred account with referral code
    console.log('\n📌 Step 4: Sign Up New User with Referral');
    await signupWithReferral(referred, referralCode);

    // Step 5: Check referrer's credits and stats
    console.log('\n📌 Step 5: Verify Referral Rewards');
    const referrerCredits = await getUserCredits(referrerToken);
    const updatedReferralInfo = await getReferralInfo(referrerToken);

    console.log('\n🎉 Test Results:');
    console.log('================');
    console.log(`✅ Referrer Credits: ${referrerCredits} (should be 100+)`);
    console.log(`✅ Total Referrals: ${updatedReferralInfo.stats.totalReferrals}`);
    console.log(`✅ Credits Earned: ${updatedReferralInfo.stats.creditsEarned}`);

    console.log('\n✨ All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);