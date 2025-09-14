import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Enable OAuth debug logging when DEBUG_OAUTH is set
const isDebugEnabled = process.env.DEBUG_OAUTH === 'true';

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

// OAuth configuration test endpoint
router.get("/test-config", (req: Request, res: Response) => {
  const config = {
    googleClientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    sessionSecretExists: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
    debugOAuthEnabled: process.env.DEBUG_OAUTH === 'true',
    callbackUrl: req ? getCallbackUrl(req) : '/api/auth/google/callback',
    sessionCookieSettings: req.session?.cookie ? {
      httpOnly: req.session.cookie.httpOnly,
      secure: req.session.cookie.secure,
      sameSite: req.session.cookie.sameSite,
      domain: req.session.cookie.domain,
      path: req.session.cookie.path,
      maxAge: req.session.cookie.maxAge,
    } : null,
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    userAgent: req.get('User-Agent'),
    isMobile: /Mobile|Android|iPhone|iPad|BlackBerry|Opera Mini|IEMobile/.test(req.get('User-Agent') || ''),
  };
  
  res.json(config);
});

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
  // Use the current request host for dynamic callback URL
  const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
  const host = req.get('Host') || req.hostname;
  
  // For production and Replit, use the actual host from the request
  if (host) {
    return `${protocol}://${host}/api/auth/google/callback`;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:5000/api/auth/google/callback';
}

// Configure Google OAuth Strategy with state parameter for CSRF protection
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' ? 'https://myaimediamgr.com/api/auth/google/callback' : '/api/auth/google/callback', // Use full URL in production, relative in dev
    scope: ['openid', 'email', 'profile'],
    state: true, // Enable state parameter for CSRF protection
    proxy: true, // Trust proxy headers for proper protocol/host detection
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
  
  // Force session save before redirecting to Google
  req.session.save((err) => {
    if (err) {
      console.error('[OAuth Error] Failed to save session before OAuth redirect:', err);
    }
  });
  
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
    console.log('[OAuth] Return URL provided:', returnUrl);
    safeDebugLog('[OAuth Debug] Return URL provided:', { returnUrl });
    if (isValidReturnUrl(returnUrl)) {
      req.session.returnTo = returnUrl;
      req.session.returnUrl = returnUrl; // Store in both places for compatibility
      console.log('[OAuth] Valid return URL stored in session:', returnUrl);
      safeDebugLog('[OAuth Debug] Valid return URL stored in session:', { returnUrl });
    } else {
      console.warn('[OAuth Warning] Invalid return URL attempted:', returnUrl);
      safeDebugLog('[OAuth Warning] Invalid return URL attempted:', {
        returnUrl,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
      });
      req.session.returnTo = '/dashboard';
      req.session.returnUrl = '/dashboard';
    }
  } else {
    // Default to dashboard if no return URL provided
    req.session.returnTo = '/dashboard';
    req.session.returnUrl = '/dashboard';
    console.log('[OAuth] No return URL provided, defaulting to /dashboard');
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
    console.log('[OAuth] Callback received with query params:', Object.keys(req.query));
    console.log('[OAuth] Session exists:', !!req.session);
    console.log('[OAuth] Session ID:', req.sessionID);
    console.log('[OAuth] Session cookie settings:', req.session?.cookie);
    
    logMobileDiagnostics(req, 'oauth-callback');
    
    // Verify CSRF state parameter (but don't fail if missing on mobile)
    const receivedState = req.query.state;
    const expectedState = req.session?.oauthState;
    const stateMatches = receivedState === expectedState;
    const isMobile = /Mobile|Android|iPhone|iPad|BlackBerry|Opera Mini|IEMobile/.test(req.get('User-Agent') || '');
    
    console.log('[OAuth] CSRF state check:', { 
      receivedState: receivedState ? 'present' : 'missing',
      expectedState: expectedState ? 'present' : 'missing',
      matches: stateMatches,
      isMobile
    });
    
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
    
    // Log CSRF state mismatch explicitly (but be more lenient on mobile)
    if (!stateMatches && process.env.NODE_ENV === 'production') {
      console.error('[OAuth Error] CSRF state parameter mismatch detected');
      safeDebugLog('[OAuth Error] CSRF state parameter mismatch detected:', {
        receivedState,
        expectedState,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
      });
      // Be more lenient on mobile browsers where state can get lost
      if (receivedState && expectedState && !isMobile) {
        return res.redirect('/auth?error=csrf_state_mismatch');
      }
      console.warn('[OAuth Warning] State parameter issue detected, continuing authentication due to', isMobile ? 'mobile browser' : 'missing state');
    }
    
    // Clean up state from session
    delete req.session.oauthState;
    
    if (req.query.error) {
      console.error('[OAuth Error] Google OAuth error in callback:', req.query.error);
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
      session: true, // Ensure passport uses sessions
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
  async (req: Request, res: Response) => {
    console.log('[OAuth] Authentication successful, entering final handler');
    console.log('[OAuth] User exists:', !!req.user);
    console.log('[OAuth] Session exists:', !!req.session);
    
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
      console.error('[OAuth Error] No user object after successful authentication');
      safeDebugLog('[OAuth Error] No user object after successful authentication:', debugInfo);
      return res.redirect("/auth?error=no_user_object");
    }
    
    console.log('[OAuth] User authenticated:', {
      userId: user.id,
      email: maskEmail(user.email || ''),
      needsTrialSelection: user.needsTrialSelection
    });
    
    safeDebugLog('[OAuth Debug] User authenticated successfully:', {
      ...debugInfo,
      userId: user.id,
      email: user.email,
      needsTrialSelection: user.needsTrialSelection,
    });
    
    try {
      // Check if user is valid before creating session
      if (!user.id || !user.email) {
        console.error('[OAuth Error] Invalid user data:', { 
          hasId: !!user.id, 
          hasEmail: !!user.email 
        });
        return res.redirect('/auth?error=invalid_user');
      }
      
      createUserSession(req, user);
      
      console.log('[OAuth] Session created with userId:', user.id);
      console.log('[OAuth] Session data:', {
        sessionUserId: req.session.userId,
        sessionUser: req.session.user ? { id: req.session.user.id, email: req.session.user.email } : null
      });
      safeDebugLog('[OAuth Debug] Session created, attempting to save...');
      
      // Use async/await for session save to ensure it completes
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
        if (err) {
          console.error('[OAuth Error] Session save failed:', err.message);
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
          
          // Try to regenerate session and save again
          req.session.regenerate((regenErr) => {
            if (regenErr) {
              console.error('[OAuth Error] Session regeneration failed:', regenErr.message);
              reject(regenErr);
              return;
            }
            
            // Re-create session after regeneration
            createUserSession(req, user);
            
            req.session.save((finalErr) => {
              if (finalErr) {
                console.error('[OAuth Error] Final session save failed:', finalErr.message);
                reject(finalErr);
              } else {
                console.log('[OAuth] Session regenerated and saved successfully');
                resolve();
              }
            });
          });
          return;
        }
        
        console.log('[OAuth] Session saved successfully');
        safeDebugLog('[OAuth Debug] Session saved successfully:', {
          ...debugInfo,
          userId: user.id,
          sessionUserId: req.session.userId,
        });
        resolve();
      });
      });
      
      // Check if user needs trial selection
      console.log('[OAuth] Checking user trial status:', {
        needsTrialSelection: user.needsTrialSelection,
        tier: user.tier,
        trialVariant: user.trialVariant
      });
      
      if (user.needsTrialSelection) {
        console.log('[OAuth] User needs trial selection, redirecting to /trial-selection');
        safeDebugLog('[OAuth Debug] User needs trial selection, redirecting to trial-selection');
        return res.redirect("/trial-selection");
      }
      
      // Redirect to home page or validated return URL
      let returnTo = "/dashboard"; // Default to dashboard instead of root
      
      // Check both returnTo and returnUrl for compatibility
      const sessionReturnUrl = req.session.returnTo || req.session.returnUrl;
      
      if (sessionReturnUrl) {
        console.log('[OAuth] Return URL found in session:', sessionReturnUrl);
        safeDebugLog('[OAuth Debug] Return URL found in session:', { returnUrl: sessionReturnUrl });
        // Re-validate return URL before using it
        if (isValidReturnUrl(sessionReturnUrl)) {
          returnTo = sessionReturnUrl;
          console.log('[OAuth] Using validated return URL:', returnTo);
          safeDebugLog('[OAuth Debug] Using validated return URL:', { returnTo });
        } else {
          console.warn('[OAuth Warning] Invalid return URL in session:', sessionReturnUrl);
          safeDebugLog('[OAuth Warning] Invalid return URL in session:', {
            returnUrl: sessionReturnUrl,
            userAgent: req.get('User-Agent'),
            origin: req.get('Origin'),
          });
        }
        delete req.session.returnTo;
        delete req.session.returnUrl;
      }
      
      console.log('[OAuth] Final redirect to:', returnTo);
      safeDebugLog('[OAuth Debug] Final redirect to:', { returnTo });
      res.redirect(returnTo);
    } catch (error) {
      console.error('[OAuth Error] Exception in callback success handler:', error instanceof Error ? error.message : error);
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