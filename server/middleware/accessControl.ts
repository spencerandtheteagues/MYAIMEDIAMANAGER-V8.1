import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Middleware to check if user account is paused or trial expired
export async function checkUserAccess(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip for public endpoints
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/verification',
      '/api/health',
      '/metrics',
    ];
    
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Get user ID from session or request
    let userId: string | undefined;
    
    // Check session-based auth first
    if (req.session?.userId) {
      userId = req.session.userId;
    }
    // Check if user object has id directly (from session auth middleware)
    else if ((req as any).user?.id) {
      userId = (req as any).user.id;
    }
    // Check Replit auth claims
    else if ((req as any).user?.claims?.sub) {
      userId = (req as any).user.claims.sub;
    }
    
    if (!userId) {
      // No user logged in, let auth middleware handle it
      return next();
    }

    // Fetch user from storage
    const user = await storage.getUser(userId);
    
    if (!user) {
      return next();
    }

    // Skip access control for admin users
    if (user.isAdmin) {
      return next();
    }

    // Check if account is paused/frozen
    if (user.accountStatus === 'frozen' || user.pausedAt) {
      return res.status(423).json({
        error: 'account_paused',
        message: 'Your account has been temporarily paused',
        reason: user.pausedReason || 'Please contact support for more information',
        code: 'ACCOUNT_PAUSED'
      });
    }

    // Check if trial has expired (only for free tier users)
    if (user.tier === 'free' && !user.isPaid) {
      const now = new Date();
      const trialEndDate = user.trialEndDate || user.trialEndsAt;
      
      if (trialEndDate && new Date(trialEndDate) < now) {
        // Allow access to billing and pricing pages
        const allowedPaths = [
          '/api/user',
          '/api/billing',
          '/api/stripe',
          '/api/notifications',
        ];
        
        if (!allowedPaths.some(path => req.path.startsWith(path))) {
          return res.status(423).json({
            error: 'trial_expired',
            message: 'Your free trial has expired',
            code: 'TRIAL_EXPIRED',
            trialEndDate: trialEndDate
          });
        }
      }
    }

    // User has access, continue
    next();
  } catch (error) {
    console.error('Error in access control middleware:', error);
    // Don't block on errors, let request continue
    next();
  }
}

// Middleware to check if a specific user is paused (for admin operations)
export async function isUserPaused(userId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    return user.accountStatus === 'frozen' || Boolean(user.pausedAt);
  } catch (error) {
    console.error('Error checking if user is paused:', error);
    return false;
  }
}

// Helper to check if trial is expired
export async function isTrialExpired(userId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    // Only check for free tier users
    if (user.tier !== 'free' || user.isPaid) {
      return false;
    }
    
    const now = new Date();
    const trialEndDate = user.trialEndDate || user.trialEndsAt;
    
    if (!trialEndDate) {
      return false;
    }
    
    return new Date(trialEndDate) < now;
  } catch (error) {
    console.error('Error checking if trial is expired:', error);
    return false;
  }
}