import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function testReferralSystem() {
  try {
    console.log('Testing Referral System...\n');
    
    // 1. Test that all users have referral codes
    const allUsers = await db.select().from(users);
    console.log(`Total users: ${allUsers.length}`);
    
    const usersWithCodes = allUsers.filter(u => u.referralCode);
    console.log(`Users with referral codes: ${usersWithCodes.length}`);
    
    if (usersWithCodes.length === allUsers.length) {
      console.log('✅ All users have referral codes');
    } else {
      console.log('❌ Some users are missing referral codes');
    }
    
    // 2. Display sample referral links for testing
    console.log('\nSample Referral Links:');
    const sampleUsers = usersWithCodes.slice(0, 3);
    for (const user of sampleUsers) {
      console.log(`${user.email}: https://localhost:5000/auth?ref=${user.referralCode}`);
    }
    
    // 3. Check for any existing referrals
    const usersWithReferrals = allUsers.filter(u => u.referredBy);
    console.log(`\nUsers who were referred: ${usersWithReferrals.length}`);
    
    console.log('\n✅ Referral system test complete!');
    console.log('Next steps:');
    console.log('1. Visit /referrals page to see your referral dashboard');
    console.log('2. Copy your referral link and share it');
    console.log('3. New users can register using /auth?ref=YOUR_CODE');
    
  } catch (error) {
    console.error('❌ Error testing referral system:', error);
  } finally {
    process.exit(0);
  }
}

testReferralSystem();