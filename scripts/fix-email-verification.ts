import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq, or } from "drizzle-orm";

async function fixEmailVerification() {
  console.log("Fixing email verification for admin accounts...");

  try {
    // Update both admin accounts to have emailVerified = true
    const result = await db.update(users)
      .set({ 
        emailVerified: true,
        trialVideosRemaining: 10, // Also ensure they have trial videos available
        trialImagesRemaining: 20  // And trial images
      })
      .where(
        or(
          eq(users.email, "spencerandtheteagues@gmail.com"),
          eq(users.email, "jaysonpowers505@gmail.com")
        )
      )
      .returning();
    
    console.log(`Updated ${result.length} admin accounts with email verification`);
    
    // Verify the updates
    const admins = await db.select().from(users).where(
      or(
        eq(users.email, "spencerandtheteagues@gmail.com"),
        eq(users.email, "jaysonpowers505@gmail.com")
      )
    );
    
    for (const admin of admins) {
      console.log(`${admin.email}: emailVerified=${admin.emailVerified}, credits=${admin.credits}, trialVideos=${admin.trialVideosRemaining}`);
    }

    console.log("Email verification fix completed!");
  } catch (error) {
    console.error("Error fixing email verification:", error);
    process.exit(1);
  }
}

// Run the fix
fixEmailVerification().then(() => process.exit(0));