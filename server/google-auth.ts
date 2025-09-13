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
  // In production, use the actual domain
  if (process.env.REPLIT_DOMAINS) {
    const firstDomain = process.env.REPLIT_DOMAINS.split(',')[0];
    return `https://${firstDomain}/api/auth/google/callback`;
  }
  // In development
  const protocol = req.secure ? 'https' : 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}/api/auth/google/callback`;
}

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
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

// Initiate Google OAuth flow
router.get("/google", (req: Request, res: Response, next: Function) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ 
      message: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." 
    });
  }
  
  // Store return URL in session if provided
  if (req.query.return) {
    req.session.returnTo = req.query.return as string;
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
        
        // Redirect to dashboard or return URL
        const returnTo = req.session.returnTo || "/dashboard";
        delete req.session.returnTo;
        res.redirect(returnTo);
      });
    } else {
      res.redirect("/auth?error=no_user");
    }
  }
);

export default router;