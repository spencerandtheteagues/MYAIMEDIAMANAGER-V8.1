import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Store last activity update time for each user to throttle updates
const lastActivityUpdate = new Map<string, number>();

// Throttle duration in milliseconds (1 minute)
const THROTTLE_DURATION = 60 * 1000;

// Middleware to track user activity
export async function trackUserActivity(req: Request, res: Response, next: NextFunction) {
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
      // No user logged in, skip activity tracking
      return next();
    }

    // Check if we should update activity (throttled to once per minute)
    const lastUpdate = lastActivityUpdate.get(userId) || 0;
    const now = Date.now();
    
    if (now - lastUpdate >= THROTTLE_DURATION) {
      // Update user activity in background (don't wait for it)
      storage.updateUserActivity(userId)
        .then(() => {
          lastActivityUpdate.set(userId, now);
          // Clean up old entries if map gets too large
          if (lastActivityUpdate.size > 1000) {
            // Remove entries older than 1 hour
            const oneHourAgo = now - (60 * 60 * 1000);
            for (const [key, value] of lastActivityUpdate.entries()) {
              if (value < oneHourAgo) {
                lastActivityUpdate.delete(key);
              }
            }
          }
        })
        .catch(error => {
          console.error('Error updating user activity:', error);
        });
    }

    next();
  } catch (error) {
    console.error('Error in activity tracking middleware:', error);
    // Don't block on errors, let request continue
    next();
  }
}

// Helper function to check if user is online (active within last 5 minutes)
export async function isUserOnline(userId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.lastActivityAt) {
      return false;
    }
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(user.lastActivityAt) > fiveMinutesAgo;
  } catch (error) {
    console.error('Error checking if user is online:', error);
    return false;
  }
}

// Helper function to get user's last activity time
export async function getUserLastActivity(userId: string): Promise<Date | null> {
  try {
    const user = await storage.getUser(userId);
    return user?.lastActivityAt ? new Date(user.lastActivityAt) : null;
  } catch (error) {
    console.error('Error getting user last activity:', error);
    return null;
  }
}

// Helper function to get all online users (for admin dashboard)
export async function getOnlineUsers(): Promise<string[]> {
  try {
    const allUsers = await storage.getAllUsers();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return allUsers
      .filter(user => user.lastActivityAt && new Date(user.lastActivityAt) > fiveMinutesAgo)
      .map(user => user.id);
  } catch (error) {
    console.error('Error getting online users:', error);
    return [];
  }
}