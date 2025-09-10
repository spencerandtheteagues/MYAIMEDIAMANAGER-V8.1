import { TRIAL } from "../../config/trial";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export function withTrialGuard(op: "text" | "image" | "video") {
  return async (req: any, res: any, next: any) => {
    // Get user from request
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Fetch user from database
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    const u = userResult[0];
    
    if (!u) {
      return res.status(401).json({ error: "User not found" });
    }
    
    // Check email verification
    if (!u.emailVerified) {
      return res.status(403).json({ error: "Verify email to use the trial." });
    }
    
    // Check if user is in trial period
    const now = Date.now();
    const trialActive = u.trialStartedAt && u.trialEndsAt && now <= new Date(u.trialEndsAt).getTime();
    
    if (!trialActive) {
      // Not in trial, proceed to credit check
      return next();
    }
    
    // Store user in request for later use
    req.trialUser = u;
    
    // Handle different operation types
    if (op === "text") {
      // Text generation is unlimited during trial
      res.locals.trialEligible = "text";
      return next();
    }
    
    if (op === "image") {
      if (u.trialImagesRemaining && u.trialImagesRemaining <= 0) {
        // No trial images left, proceed to credit check
        return next();
      }
      res.locals.trialEligible = "image";
      return next();
    }
    
    if (op === "video") {
      // Video is gated during trial
      if (!u.trialVideosRemaining || u.trialVideosRemaining <= 0) {
        return res.status(402).json({
          error: "Unlock video by adding a card or buying a $5 micro pack.",
          actions: {
            addCard: true,
            buyPack: true
          }
        });
      }
      
      // Cap video duration for trial users
      req.body.durationSeconds = Math.min(
        Number(req.body.durationSeconds || 8),
        TRIAL.videoSecondsCap
      );
      
      res.locals.trialEligible = "video";
      return next();
    }
  };
}

export async function consumeTrialIfEligible(req: any, res: any) {
  const op = res.locals.trialEligible;
  if (!op || op === "text") return; // Text is unlimited
  
  const userId = req.user?.id || req.headers['x-user-id'];
  if (!userId) return;
  
  const column = op === "image" 
    ? "trial_images_remaining" 
    : op === "video" 
      ? "trial_videos_remaining" 
      : null;
      
  if (!column) return;
  
  try {
    // Decrement the trial counter
    await db.execute(
      `UPDATE users SET ${column} = ${column} - 1 WHERE id = $1 AND ${column} > 0`,
      [userId]
    );
    
    console.log(`Trial ${op} consumed for user ${userId}`);
  } catch (error) {
    console.error(`Failed to consume trial ${op}:`, error);
  }
}