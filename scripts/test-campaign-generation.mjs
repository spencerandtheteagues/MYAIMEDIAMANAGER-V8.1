#!/usr/bin/env node

// Test script to verify campaign generation fixes
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

async function testCampaignGeneration() {
  console.log('🚀 Testing Campaign Generation Fixes...\n');
  
  try {
    // Step 1: Sign up a test user
    console.log('1️⃣ Creating test user...');
    const signupData = {
      email: `test-campaign-${Date.now()}@example.com`,
      password: 'TestPass123!',
      username: `testuser${Date.now()}`,
      businessName: 'Test Business'
    };
    
    const signupResponse = await axios.post(`${API_BASE}/api/auth/signup`, signupData, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
    
    const user = signupResponse.data;
    console.log(`✅ User created: ${user.email} (${user.credits} credits)\n`);
    
    // Get cookies for authentication
    const cookies = signupResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    
    // Step 2: Generate a campaign
    console.log('2️⃣ Generating campaign...');
    const campaignData = {
      prompt: 'Summer fitness challenge promotion',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      cadence: '2_per_day_7_days',
      businessName: 'FitLife Gym',
      productName: 'Summer Fitness Challenge',
      targetAudience: 'Health-conscious adults 25-45',
      brandTone: 'motivational',
      keyMessages: ['Transform your body', 'Expert coaching', 'Community support'],
      callToAction: 'Join Now'
    };
    
    console.log('Campaign request data:', JSON.stringify(campaignData, null, 2));
    
    const campaignResponse = await axios.post(
      `${API_BASE}/api/campaigns/generate`, 
      campaignData,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookieHeader 
        },
        withCredentials: true
      }
    );
    
    const campaign = campaignResponse.data;
    console.log(`✅ Campaign generated successfully!`);
    console.log(`   - Campaign ID: ${campaign.campaignId}`);
    console.log(`   - Posts created: ${campaign.postCount}`);
    console.log(`   - Status: ${campaign.campaign.status}\n`);
    
    // Step 3: Verify posts have platforms field
    console.log('3️⃣ Verifying posts structure...');
    let allPostsValid = true;
    
    campaign.posts.forEach((post, index) => {
      if (!post.platforms || !Array.isArray(post.platforms)) {
        console.log(`❌ Post ${index + 1} missing platforms field!`);
        allPostsValid = false;
      } else {
        console.log(`✅ Post ${index + 1}: platforms = [${post.platforms.join(', ')}]`);
      }
    });
    
    if (allPostsValid) {
      console.log('\n✅ All posts have valid platforms field!');
    } else {
      console.log('\n❌ Some posts are missing platforms field');
    }
    
    // Step 4: Check for AI generation errors
    console.log('\n4️⃣ Checking content generation...');
    let contentGenerated = true;
    
    campaign.posts.forEach((post, index) => {
      if (!post.content || post.content.includes('Post ' + (index + 1))) {
        console.log(`⚠️ Post ${index + 1} has fallback content (AI generation may have failed)`);
        contentGenerated = false;
      }
    });
    
    if (contentGenerated) {
      console.log('✅ All posts have AI-generated content!');
    } else {
      console.log('⚠️ Some posts have fallback content');
    }
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`✅ Campaign generation: SUCCESS`);
    console.log(`${allPostsValid ? '✅' : '❌'} Platforms field: ${allPostsValid ? 'FIXED' : 'STILL BROKEN'}`);
    console.log(`${contentGenerated ? '✅' : '⚠️'} AI generation: ${contentGenerated ? 'WORKING' : 'PARTIAL'}`);
    
    return { success: true, allPostsValid, contentGenerated };
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return { success: false };
  }
}

// Run the test
testCampaignGeneration()
  .then(result => {
    process.exit(result.success && result.allPostsValid ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });