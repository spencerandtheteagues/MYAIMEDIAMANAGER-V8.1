import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Endpoints that are allowed even when trial has expired
const ALLOWED_ENDPOINTS = [
  '/api/user',
  '/api/auth',
  '/api/billing',
  '/api/subscription',
  '/api/credits',
  '/api/stripe',
  '/api/verification',
  '/health',
  '/metrics'
];

/**
 * Middleware to enforce trial expiration
 * Blocks access to all endpoints except billing/auth when trial expires
 */
export async function enforceTrialExpiration(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Skip enforcement for allowed endpoints
    const isAllowedEndpoint = ALLOWED_ENDPOINTS.some(endpoint => 
      req.path.startsWith(endpoint)
    );
    
    if (isAllowedEndpoint) {
      return next();
    }

    // Get user ID from session or request
    const userId = (req as any).session?.userId || (req as any).user?.id;
    
    if (!userId) {
      // No user, let auth middleware handle it
      return next();
    }

    // Get user from storage
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is on a trial tier
    const trialTiers = ['free_trial', 'nocard7', 'card7'];
    const isOnTrial = trialTiers.includes(user.tier);
    
    if (!isOnTrial) {
      // Not on trial, allow access
      return next();
    }

    // Check if trial has expired
    const now = new Date();
    const trialEndsAt = user.trialEndsAt;
    
    if (!trialEndsAt) {
      // No trial end date set, allow access (shouldn't happen)
      console.warn(`User ${userId} on trial tier but no trialEndsAt date set`);
      return next();
    }

    const isTrialExpired = now > new Date(trialEndsAt);
    
    if (isTrialExpired) {
      // Trial has expired, block access
      console.log(`Blocking access for user ${userId} - trial expired on ${trialEndsAt}`);
      
      return res.status(403).json({
        message: "Your free trial has expired. Please upgrade to continue using MyAiMediaMgr.",
        trialExpired: true,
        trialEndsAt: trialEndsAt,
        redirectTo: "/trial-expired"
      });
    }

    // Trial is still active, allow access
    next();
  } catch (error) {
    console.error("Error in trial enforcement middleware:", error);
    // On error, allow request to continue (fail open for now)
    next();
  }
}

/**
 * Helper function to check if a user's trial has expired
 */
export async function isUserTrialExpired(userId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      return false;
    }

    const trialTiers = ['free_trial', 'nocard7', 'card7'];
    const isOnTrial = trialTiers.includes(user.tier);
    
    if (!isOnTrial) {
      return false;
    }

    const now = new Date();
    const trialEndsAt = user.trialEndsAt;
    
    if (!trialEndsAt) {
      return false;
    }

    return now > new Date(trialEndsAt);
  } catch (error) {
    console.error("Error checking trial expiration:", error);
    return false;
  }
}