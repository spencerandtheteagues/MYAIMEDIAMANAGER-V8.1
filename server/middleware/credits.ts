import { storage } from "../storage";
import { CREDIT_COSTS } from "../../shared/credits";

export function requireCredits(kind:"text"|"image"|"video"){
  return async (req:any,res:any,next:any)=>{
    // If trial will cover it, skip credit precheck.
    if (res.locals.trialEligible) return next();

    const userId = req.user?.id || req.headers['x-user-id'];
    const u = userId ? await storage.getUser(userId) : null;
    if (!u) return res.status(401).json({ error:"Auth required" });

    const cost = CREDIT_COSTS[kind];
    if ((u.credits ?? 0) < cost) {
      return res.status(402).json({ error:"Insufficient credits", required: cost, have: u.credits||0 });
    }
    res.locals.debit = cost;
    res.locals.creditUserId = userId;
    next();
  };
}

export async function deductCredits(res:any){
  if (res.locals.trialEligible) return; // trial consumed, not credits
  if (!res.locals.debit || !res.locals.creditUserId) return;
  
  const userId = res.locals.creditUserId;
  const debit = res.locals.debit;
  
  // Deduct credits from user
  const user = await storage.getUser(userId);
  if (user) {
    await storage.updateUser(userId, {
      credits: Math.max(0, (user.credits || 0) - debit),
      totalCreditsUsed: (user.totalCreditsUsed || 0) + debit
    });
  }
  
  res.locals.debit = 0;
}