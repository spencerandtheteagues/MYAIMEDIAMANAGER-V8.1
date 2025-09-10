import { Router } from "express";
import { TRIAL, TrialVariant } from "../config/trial";
import { storage } from "./storage";

export const trialRouter = Router();

function requireAuth(req:any,res:any,next:any){
  if(!req.user?.id) return res.status(401).json({ error:"AUTH_REQUIRED" });
  next();
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
  await storage.updateUser(req.user.id, {
    trialVariant: variant,
    trialStartedAt: now,
    trialEndsAt: end,
    trialImagesRemaining: v.images,
    trialVideosRemaining: v.videos,
  });
  res.json({ ok:true, variant, endsAt: end.toISOString() });
});