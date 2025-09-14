import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const router = Router();

// Validate Google OAuth is configured
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
}

// Helper to create user session
function createUserSession(req: Request, user: User) {
  const sessionUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    businessName: user.businessName,
    role: user.role,
    tier: user.tier,
    isAdmin: user.isAdmin,
  };
  
  req.session.userId = user.id;
  req.session.user = sessionUser;
  req.user = sessionUser;
}

// Get the base URL for callbacks
function getCallbackUrl(req: Request): string {
  // In production, always use the apex domain for OAuth consistency
  if (process.env.NODE_ENV === 'production') {
    return 'https://myaimediamgr.com/api/auth/google/callback';
  }
  
  // In development, check for Replit domains first
  if (process.env.REPLIT_DOMAINS) {
    const firstDomain = process.env.REPLIT_DOMAINS.split(',')[0];
    return `https://${firstDomain}/api/auth/google/callback`;
  }
  
  // Local development
  return 'http://localhost:5000/api/auth/google/callback';
}

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
      ? 'https://myaimediamgr.com/api/auth/google/callback'
      : '/api/auth/google/callback',
    scope: ['profile', 'email'],
    passReqToCallback: true
  },
  async (req: Request, accessToken: string, refreshToken: string, profile: any, done: Function) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'));
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user from Google profile
        const username = email.split('@')[0] + '_' + profile.id.slice(-4);
        
        // Set up trial for new Google users
        const now = new Date();
        const trialDays = 7;
        const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
        
        user = await storage.createUser({
          email: email,
          username: username,
          password: null, // No password for OAuth users
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          fullName: profile.displayName,
          profileImageUrl: profile.photos?.[0]?.value,
          googleAvatar: profile.photos?.[0]?.value,
          role: "user",
          tier: "free_trial",
          credits: 50,
          emailVerified: true, // Google accounts are pre-verified
          trialVariant: "nocard7",
          trialStartedAt: now,
          trialEndsAt: trialEndsAt,
          trialImagesRemaining: 6,
          trialVideosRemaining: 0,
          needsTrialSelection: true, // New users need to select trial
        });
      } else {
        // Update existing user's Google info
        await storage.updateUser(user.id, {
          googleAvatar: profile.photos?.[0]?.value,
          profileImageUrl: user.profileImageUrl || profile.photos?.[0]?.value,
          emailVerified: true,
          lastLoginAt: new Date(),
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Initialize passport middleware
router.use(passport.initialize());
router.use(passport.session());

// Helper to validate return URL to prevent open redirect attacks
function isValidReturnUrl(url: string): boolean {
  if (!url) return false;
  
  // Must start with / but not with // (protocol-relative URL)
  if (!url.startsWith('/') || url.startsWith('//')) {
    return false;
  }
  
  // Should not contain @ or : which could be used for URL manipulation
  if (url.includes('@') || url.includes(':')) {
    return false;
  }
  
  // Valid internal paths we allow
  const validPaths = [
    '/dashboard',
    '/auth',
    '/trial-selection',
    '/checkout',
    '/posts',
    '/analytics',
    '/campaigns',
    '/platforms',
    '/settings',
    '/ai-generate',
    '/'
  ];
  
  // Check if URL starts with any valid path
  return validPaths.some(path => url === path || url.startsWith(path + '/') || url.startsWith(path + '?'));
}

// Initiate Google OAuth flow
router.get("/google", (req: Request, res: Response, next: Function) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ 
      message: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." 
    });
  }
  
  // Store return URL in session if provided and valid
  if (req.query.return) {
    const returnUrl = req.query.return as string;
    if (isValidReturnUrl(returnUrl)) {
      req.session.returnTo = returnUrl;
    } else {
      console.warn('Invalid return URL attempted:', returnUrl);
      req.session.returnTo = '/dashboard';
    }
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// Google OAuth callback handler
router.get("/google/callback", 
  passport.authenticate('google', { failureRedirect: '/auth?error=google_auth_failed' }),
  (req: Request, res: Response) => {
    // Authentication successful
    const user = req.user as User;
    if (user) {
      createUserSession(req, user);
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect("/auth?error=session_failed");
        }
        
        // Check if user needs trial selection
        if (user.needsTrialSelection) {
          return res.redirect("/trial-selection");
        }
        
        // Redirect to dashboard or validated return URL
        let returnTo = "/dashboard";
        if (req.session.returnTo) {
          // Re-validate return URL before using it
          if (isValidReturnUrl(req.session.returnTo)) {
            returnTo = req.session.returnTo;
          }
          delete req.session.returnTo;
        }
        res.redirect(returnTo);
      });
    } else {
      res.redirect("/auth?error=no_user");
    }
  }
);

export default router;