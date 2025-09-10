import { db } from "../db";
import { users, creditTransactions } from "@shared/schema";
import { eq } from "drizzle-orm";

const CREDIT_COSTS = {
  text: 1,
  image: 5,
  video: 20
};

export function requireCredits(operation: "text" | "image" | "video") {
  return async (req: any, res: any, next: any) => {
    // Skip if trial is handling this request
    if (res.locals.trialEligible) {
      return next();
    }
    
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get user's current credits
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    const user = userResult[0];
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const cost = CREDIT_COSTS[operation];
    
    if (user.credits < cost) {
      return res.status(402).json({
        error: `Insufficient credits. You need ${cost} credits for ${operation} generation.`,
        required: cost,
        available: user.credits,
        actions: {
          purchaseCredits: true
        }
      });
    }
    
    // Store cost for later deduction
    res.locals.creditCost = cost;
    res.locals.creditUserId = userId;
    
    next();
  };
}

export async function deductCredits(res: any) {
  // Skip if trial handled this
  if (res.locals.trialEligible) {
    return;
  }
  
  const cost = res.locals.creditCost;
  const userId = res.locals.creditUserId;
  
  if (!cost || !userId) return;
  
  try {
    // Deduct credits
    await db.execute(
      `UPDATE users SET credits = credits - $1, total_credits_used = total_credits_used + $1 WHERE id = $2`,
      [cost, userId]
    );
    
    // Record transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: -cost,
      type: 'usage',
      description: `${res.locals.operation || 'AI'} generation`,
      balance: 0 // Will be updated by trigger if available
    });
    
    console.log(`Deducted ${cost} credits from user ${userId}`);
  } catch (error) {
    console.error('Failed to deduct credits:', error);
  }
}