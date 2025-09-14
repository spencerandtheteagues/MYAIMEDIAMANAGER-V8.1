import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Enable OAuth debug logging only when DEBUG_OAUTH is set and not in production
const isDebugEnabled = process.env.DEBUG_OAUTH === 'true' && process.env.NODE_ENV !== 'production';

// Helper function to mask email for logging
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) return email;
  return `${localPart[0]}***@${domain}`;
}

// Helper to safely log debug info with PII protection
function safeDebugLog(message: string, data: any = {}) {
  if (!isDebugEnabled) return;
  
  // Remove sensitive data and mask PII
  const safeData = { ...data };
  delete safeData.sessionId;
  delete safeData.profile;
  delete safeData.accessToken;
  delete safeData.refreshToken;
  
  if (safeData.email) {
    safeData.email = maskEmail(safeData.email);
  }
  if (safeData.profileEmails) {
    safeData.profileEmails = safeData.profileEmails.map(maskEmail);
  }
  if (safeData.sessionUserEmail) {
    safeData.sessionUserEmail = maskEmail(safeData.sessionUserEmail);
  }
  
  console.log(message, safeData);
}

// Helper to log mobile-specific diagnostics
function logMobileDiagnostics(req: Request, stage: string) {
  if (!isDebugEnabled) return;
  
  const cookieHeader = req.headers.cookie;
  const cookieSize = cookieHeader ? cookieHeader.length : 0;
  
  const diagnostics = {
    stage,
    timestamp: new Date().toISOString(),
    isMobile: /Mobile|Android|iPhone|iPad|BlackBerry|Opera Mini|IEMobile/.test(req.get('User-Agent') || ''),
    cookies: {
      present: !!cookieHeader,
      size: cookieSize,
      count: cookieHeader ? cookieHeader.split(';').length : 0,
    },
    session: {
      exists: !!req.session,
      cookieSettings: req.session?.cookie ? {
        maxAge: req.session.cookie.maxAge,
        expires: req.session.cookie.expires,
        httpOnly: req.session.cookie.httpOnly,
        secure: req.session.cookie.secure,
        sameSite: req.session.cookie.sameSite,
        domain: req.session.cookie.domain,
        path: req.session.cookie.path,
      } : null,
    },
    forwarded: {
      proto: req.get('X-Forwarded-Proto'),
      host: req.get('X-Forwarded-Host'),
      for: req.get('X-Forwarded-For'),
    },
    userAgent: req.get('User-Agent'),
    host: req.get('Host'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
  };
  
  console.log('[OAuth Mobile Diagnostics]', diagnostics);
}

// Helper function to generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateUniqueReferralCode(): Promise<string> {
  let code = '';
  let isUnique = false;
  
  while (!isUnique) {
    code = generateReferralCode();
    const existing = await storage.getUserByReferralCode(code);
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

const router = Router();

// Validate Google OAuth is configured
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
}

// Helper to create user session with secure logging
function createUserSession(req: Request, user: User) {
  // Ensure user has email before creating session
  if (!user.email) {
    throw new Error('Cannot create session: user email is required');
  }

  safeDebugLog('[OAuth Debug] Creating user session for:', {
    userId: user.id,
    email: user.email,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
  });
  
  const sessionUser = {
    id: user.id,
    email: user.email, // Now guaranteed to be non-null
    username: user.username,
    businessName: user.businessName,
    role: user.role,
    tier: user.tier,
    isAdmin: user.isAdmin,
  };
  
  req.session.userId = user.id;
  req.session.user = sessionUser;
  // Type assertion for req.user to match passport's expected type
  req.user = sessionUser as any;
  
  safeDebugLog('[OAuth Debug] Session data set:', {
    sessionUserId: req.session.userId,
    sessionUserEmail: req.session.user?.email,
  });
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

// Configure Google OAuth Strategy with state parameter for CSRF protection
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
      ? 'https://myaimediamgr.com/api/auth/google/callback'
      : '/api/auth/google/callback',
    scope: ['openid', 'email', 'profile'],
    state: true, // Enable state parameter for CSRF protection
    passReqToCallback: true
  },
  async (req: Request, accessToken: string, refreshToken: string, profile: any, done: Function) => {
    const debugInfo = {
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      profileId: profile?.id,
      profileEmails: profile?.emails?.map((e: any) => e.value),
      timestamp: new Date().toISOString(),
      state: req.query?.state, // Log CSRF state parameter
    };
    
    safeDebugLog('[OAuth Debug] Google strategy callback initiated:', debugInfo);
    logMobileDiagnostics(req, 'strategy-callback');
    
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        const error = new Error('No email found in Google profile');
        safeDebugLog('[OAuth Error] No email in profile:', {
          ...debugInfo,
          profileDisplayName: profile?.displayName,
          profileId: profile?.id,
          profileProvider: profile?.provider,
        });
        return done(error);
      }

      safeDebugLog('[OAuth Debug] Processing user with email:', { email });

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        safeDebugLog('[OAuth Debug] Creating new user for:', { email });
        // Create new user from Google profile
        const username = email.split('@')[0] + '_' + profile.id.slice(-4);
        
        // Generate unique referral code for the new user
        const userReferralCode = await generateUniqueReferralCode();
        
        // Create new user without trial details - they'll select trial after login
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
          tier: "free", // Default tier, will be updated when they select trial
          credits: 0, // Will be set when they select trial
          emailVerified: true, // Google accounts are pre-verified
          needsTrialSelection: true, // New users need to select trial
          referralCode: userReferralCode, // Add referral code for new user
        });
        safeDebugLog('[OAuth Debug] New user created:', {
          userId: user.id,
          email: user.email,
          needsTrialSelection: user.needsTrialSelection,
        });
      } else {
        safeDebugLog('[OAuth Debug] Updating existing user:', {
          userId: user.id,
          email: user.email,
          needsTrialSelection: user.needsTrialSelection,
        });
        // Update existing user's Google info
        await storage.updateUser(user.id, {
          googleAvatar: profile.photos?.[0]?.value,
          profileImageUrl: user.profileImageUrl || profile.photos?.[0]?.value,
          emailVerified: true,
          lastLoginAt: new Date(),
        });
      }
      
      safeDebugLog('[OAuth Debug] Strategy callback successful, returning user:', {
        userId: user.id,
        email: user.email,
        tier: user.tier,
        needsTrialSelection: user.needsTrialSelection,
      });
      
      return done(null, user);
    } catch (error) {
      safeDebugLog('[OAuth Error] Strategy callback failed:', {
        ...debugInfo,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: isDebugEnabled ? error.stack : undefined,
        } : error,
      });
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    safeDebugLog('[OAuth Debug] Serializing user:', {
      userId: user?.id,
      email: user?.email,
    });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    safeDebugLog('[OAuth Debug] Deserializing user ID:', { userId: id });
    try {
      const user = await storage.getUser(id);
      safeDebugLog('[OAuth Debug] User deserialized:', {
        userId: user?.id,
        email: user?.email,
        found: !!user,
      });
      done(null, user);
    } catch (error) {
      safeDebugLog('[OAuth Error] User deserialization failed:', {
        userId: id,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: isDebugEnabled ? error.stack : undefined,
        } : error,
      });
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
  logMobileDiagnostics(req, 'oauth-initiate');
  
  // Generate and store state parameter for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  req.session.oauthState = state;
  
  // Log effective callback URL being used
  const effectiveCallbackUrl = getCallbackUrl(req);
  
  const debugInfo = {
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    host: req.get('Host'),
    query: req.query,
    timestamp: new Date().toISOString(),
    isMobile: /Mobile|Android|iPhone|iPad|BlackBerry|Opera Mini|IEMobile/.test(req.get('User-Agent') || ''),
    generatedState: state,
    effectiveCallbackUrl,
  };
  
  safeDebugLog('[OAuth Debug] Initiating Google OAuth flow:', debugInfo);
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('[OAuth Error] Google OAuth not configured');
    return res.status(500).json({ 
      message: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." 
    });
  }
  
  // Store return URL in session if provided and valid
  if (req.query.return) {
    const returnUrl = req.query.return as string;
    safeDebugLog('[OAuth Debug] Return URL provided:', { returnUrl });
    if (isValidReturnUrl(returnUrl)) {
      req.session.returnTo = returnUrl;
      safeDebugLog('[OAuth Debug] Valid return URL stored in session:', { returnUrl });
    } else {
      safeDebugLog('[OAuth Warning] Invalid return URL attempted:', {
        returnUrl,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
      });
      req.session.returnTo = '/dashboard';
    }
  }
  
  safeDebugLog('[OAuth Debug] Starting passport.authenticate for Google', { state });
  passport.authenticate('google', {
    scope: ['openid', 'email', 'profile'],
    state: state // Include state parameter for CSRF protection
  })(req, res, next);
});

// Google OAuth callback handler with comprehensive error logging
router.get("/google/callback", 
  (req: Request, res: Response, next: Function) => {
    logMobileDiagnostics(req, 'oauth-callback');
    
    // Verify CSRF state parameter
    const receivedState = req.query.state;
    const expectedState = req.session.oauthState;
    const stateMatches = receivedState === expectedState;
    
    const debugInfo = {
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      host: req.get('Host'),
      query: req.query,
      timestamp: new Date().toISOString(),
      isMobile: /Mobile|Android|iPhone|iPad|BlackBerry|Opera Mini|IEMobile/.test(req.get('User-Agent') || ''),
      hasCode: !!req.query.code,
      hasError: !!req.query.error,
      errorDescription: req.query.error_description,
      receivedState,
      expectedState,
      stateMatches,
    };
    
    safeDebugLog('[OAuth Debug] Google callback received:', debugInfo);
    
    // Log CSRF state mismatch explicitly
    if (!stateMatches) {
      safeDebugLog('[OAuth Error] CSRF state parameter mismatch detected:', {
        receivedState,
        expectedState,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
      });
      return res.redirect('/auth?error=csrf_state_mismatch');
    }
    
    // Clean up state from session
    delete req.session.oauthState;
    
    if (req.query.error) {
      safeDebugLog('[OAuth Error] Google OAuth error in callback:', {
        ...debugInfo,
        error: req.query.error,
        errorDescription: req.query.error_description,
        errorUri: req.query.error_uri,
      });
      return res.redirect(`/auth?error=google_oauth_error&details=${encodeURIComponent(req.query.error as string)}`);
    }
    
    passport.authenticate('google', {
      failureRedirect: '/auth?error=google_auth_failed',
      failureMessage: true,
    })(req, res, (err: any) => {
      if (err) {
        safeDebugLog('[OAuth Error] Passport authentication failed in callback:', {
          ...debugInfo,
          error: err instanceof Error ? {
            name: err.name,
            message: err.message,
            stack: isDebugEnabled ? err.stack : undefined,
          } : err,
        });
        return res.redirect(`/auth?error=passport_auth_failed&details=${encodeURIComponent(err.message || 'Unknown error')}`);
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    logMobileDiagnostics(req, 'callback-success');
    
    const debugInfo = {
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      timestamp: new Date().toISOString(),
      isMobile: /Mobile|Android|iPhone|iPad|BlackBerry|Opera Mini|IEMobile/.test(req.get('User-Agent') || ''),
    };
    
    safeDebugLog('[OAuth Debug] Entering callback success handler:', debugInfo);
    
    // Authentication successful
    const user = req.user as User;
    if (!user) {
      safeDebugLog('[OAuth Error] No user object after successful authentication:', debugInfo);
      return res.redirect("/auth?error=no_user_object");
    }
    
    safeDebugLog('[OAuth Debug] User authenticated successfully:', {
      ...debugInfo,
      userId: user.id,
      email: user.email,
      needsTrialSelection: user.needsTrialSelection,
    });
    
    try {
      createUserSession(req, user);
      
      safeDebugLog('[OAuth Debug] Session created, attempting to save...');
      req.session.save((err) => {
        if (err) {
          safeDebugLog('[OAuth Error] Session save failed:', {
            ...debugInfo,
            userId: user.id,
            email: user.email,
            error: err instanceof Error ? {
              name: err.name,
              message: err.message,
              stack: isDebugEnabled ? err.stack : undefined,
            } : err,
            sessionData: {
              userId: req.session.userId,
              userEmail: req.session.user?.email,
            },
          });
          return res.redirect("/auth?error=session_save_failed");
        }
        
        safeDebugLog('[OAuth Debug] Session saved successfully:', {
          ...debugInfo,
          userId: user.id,
          sessionUserId: req.session.userId,
        });
        
        // Check if user needs trial selection
        if (user.needsTrialSelection) {
          safeDebugLog('[OAuth Debug] User needs trial selection, redirecting to trial-selection');
          return res.redirect("/trial-selection");
        }
        
        // Redirect to home page or validated return URL
        let returnTo = "/";
        if (req.session.returnTo) {
          safeDebugLog('[OAuth Debug] Return URL found in session:', { returnUrl: req.session.returnTo });
          // Re-validate return URL before using it
          if (isValidReturnUrl(req.session.returnTo)) {
            returnTo = req.session.returnTo;
            safeDebugLog('[OAuth Debug] Using validated return URL:', { returnTo });
          } else {
            safeDebugLog('[OAuth Warning] Invalid return URL in session:', {
              returnUrl: req.session.returnTo,
              userAgent: req.get('User-Agent'),
              origin: req.get('Origin'),
            });
          }
          delete req.session.returnTo;
        }
        
        safeDebugLog('[OAuth Debug] Final redirect to:', { returnTo });
        res.redirect(returnTo);
      });
    } catch (error) {
      safeDebugLog('[OAuth Error] Exception in callback success handler:', {
        ...debugInfo,
        userId: user?.id,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: isDebugEnabled ? error.stack : undefined,
        } : error,
      });
      res.redirect("/auth?error=callback_exception");
    }
  }
);

export default router;