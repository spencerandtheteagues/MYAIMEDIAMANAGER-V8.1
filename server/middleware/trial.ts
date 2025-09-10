import { TRIAL } from "../../config/trial";
import { storage } from "../storage";

export function withTrialGuard(op:"text"|"image"|"video"){
  return async (req:any,res:any,next:any)=>{
    const userId = req.user?.id || req.headers['x-user-id'];
    const u = userId ? await storage.getUser(userId) : null;
    if(!u) return res.status(401).json({error:"Auth required"});
    if(!u.emailVerified) return res.status(403).json({error:"Verify email to use the trial."});

    const now = Date.now();
    const active = u.trialStartedAt && u.trialEndsAt && now <= new Date(u.trialEndsAt).getTime();
    if(!active) return next();

    if(op==="text"){ res.locals.trialEligible="text"; return next(); }
    if(op==="image"){
      if((u.trialImagesRemaining || 0)<=0) return next();
      res.locals.trialEligible="image"; return next();
    }
    if(op==="video"){
      if((u.trialVideosRemaining || 0)<=0){
        // Check if user has enough credits to bypass trial requirement
        const videoCredits = 20; // Cost of video generation in credits
        if ((u.credits ?? 0) >= videoCredits) {
          // User has enough credits, let them proceed without trial
          return next();
        }
        // No trial videos and not enough credits
        return res.status(402).json({
          error:"Unlock video by adding a card or buying a $5 micro pack.",
          actions:{ addCard:true, buyPack:true }
        });
      }
      req.body.durationSeconds = Math.min(Number(req.body.durationSeconds||8), TRIAL.videoSecondsCap);
      res.locals.trialEligible="video"; return next();
    }
    next();
  };
}

export async function consumeTrialIfEligible(req:any,res:any){
  const op = res.locals.trialEligible;
  const userId = req.user?.id || req.headers['x-user-id'];
  if(!op || !userId) return;
  
  // Decrement trial counters
  if(op==="image") {
    await storage.updateUser(userId, {
      trialImagesRemaining: Math.max(0, ((await storage.getUser(userId))?.trialImagesRemaining || 0) - 1)
    });
  }
  if(op==="video") {
    await storage.updateUser(userId, {
      trialVideosRemaining: Math.max(0, ((await storage.getUser(userId))?.trialVideosRemaining || 0) - 1)
    });
  }
}