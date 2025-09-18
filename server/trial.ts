import { Router } from "express";
import { TRIAL, TrialVariant } from "../config/trial";
import { storage } from "./storage";

export const trialRouter = Router();

function requireAuth(req:any,res:any,next:any){
  // Check for session-based auth (app auth)
  if (req.session?.userId) {
    req.user = { id: req.session.userId };
    return next();
  }
  // Check for Replit auth
  if (req.user?.claims?.sub) {
    req.user = { id: req.user.claims.sub };
    return next();
  }
  // Check if user object has id directly (from session auth middleware)
  if (req.user?.id) {
    return next();
  }
  return res.status(401).json({ error:"AUTH_REQUIRED" });
}

trialRouter.get("/status", requireAuth, async (req:any,res:any)=>{
  const u = await storage.getUser(req.user.id);
  res.json({
    variant: u?.trialVariant,
    startedAt: u?.trialStartedAt,
    endsAt: u?.trialEndsAt,
    imagesRemaining: u?.trialImagesRemaining ?? 0,
    videosRemaining: u?.trialVideosRemaining ?? 0,
    emailVerified: !!u?.emailVerified,
    cardOnFile: !!u?.cardOnFile
  });
});

trialRouter.post("/select", requireAuth, async (req:any,res:any)=>{
  const variant = String(req.body.variant || TRIAL.variant) as TrialVariant;
  if(!TRIAL.variants[variant]) return res.status(400).json({ error:"BAD_VARIANT" });
  const v = TRIAL.variants[variant];
  const now = new Date();
  const end = new Date(now.getTime() + v.days*24*3600*1000);
  
  // Update user with trial details and clear needsTrialSelection flag
  await storage.updateUser(req.user.id, {
    trialVariant: variant,
    trialStartedAt: now,
    trialEndsAt: end,
    trialImagesRemaining: v.images,
    trialVideosRemaining: v.videos,
    needsTrialSelection: false, // Clear the flag
    tier: "free", // Set to free tier (trial users are still on free tier)
    credits: v.credits || 50, // Set initial credits
  });
  
  res.json({ ok:true, variant, endsAt: end.toISOString() });
});