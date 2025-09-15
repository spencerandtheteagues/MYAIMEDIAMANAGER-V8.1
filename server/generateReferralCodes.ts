import { db } from './db';
import { users } from '../shared/schema';
import { eq, isNull } from 'drizzle-orm';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateCodesForExistingUsers() {
  try {
    // Get all users without referral codes
    const usersWithoutCodes = await db
      .select()
      .from(users)
      .where(isNull(users.referralCode));
    
    console.log(`Found ${usersWithoutCodes.length} users without referral codes`);
    
    for (const user of usersWithoutCodes) {
      let code: string;
      let isUnique = false;
      
      // Generate unique code
      while (!isUnique) {
        code = generateReferralCode();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.referralCode, code))
          .limit(1);
        
        if (existing.length === 0) {
          isUnique = true;
        }
      }
      
      // Update user with referral code
      await db
        .update(users)
        .set({ referralCode: code! })
        .where(eq(users.id, user.id));
      
      console.log(`Generated referral code ${code!} for user ${user.email}`);
    }
    
    console.log('Successfully generated referral codes for all existing users');
  } catch (error) {
    console.error('Error generating referral codes:', error);
  } finally {
    process.exit(0);
  }
}

generateCodesForExistingUsers();