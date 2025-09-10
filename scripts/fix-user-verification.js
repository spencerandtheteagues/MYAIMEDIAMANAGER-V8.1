// scripts/fix-user-verification.js
// Fix email verification for test users

import { storage } from "../server/storage.js";

async function fixUserVerification() {
  console.log("Fixing email verification for test users...\n");
  
  const testEmails = [
    'test-enterprise@myaimediamgr.com',
    'test-trial@myaimediamgr.com',
    'test-pro@myaimediamgr.com'
  ];
  
  for (const email of testEmails) {
    try {
      const user = await storage.getUserByEmail(email);
      if (user) {
        await storage.updateUser(user.id, {
          emailVerified: true,
          trialStartedAt: new Date(),
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          trialImagesRemaining: 6,
          trialVideosRemaining: 0,
          credits: 100
        });
        console.log(`✓ Fixed ${email}: emailVerified=true, trial active`);
      } else {
        console.log(`✗ User not found: ${email}`);
      }
    } catch (error) {
      console.error(`Error fixing ${email}:`, error.message);
    }
  }
  
  console.log("\n✅ Email verification fixed for test users");
  process.exit(0);
}

fixUserVerification().catch(error => {
  console.error("Failed to fix verification:", error);
  process.exit(1);
});