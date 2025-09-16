import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { z } from "zod";
import type { User } from "@shared/schema";
import { signJwt } from "./auth/jwt";

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

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(100),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  businessName: z.string().optional(),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Helper to create JWT token and set cookie
function createUserJWT(res: Response, user: User): string {
  // Ensure user has email before creating JWT
  if (!user.email) {
    throw new Error('Cannot create JWT: user email is required');
  }

  const token = signJwt({
    sub: String(user.id),
    email: user.email,
    name: user.fullName,
    picture: user.googleAvatar,
    roles: [user.role],
  });

  res.cookie('mam_jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
}

// Signup endpoint
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    const existingUsername = await storage.getUserByUsername(data.username);
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Import verification functions
    const { generateVerificationCode, hashVerificationCode, sendVerificationEmail } = await import('./emailService');
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const hashedCode = await hashVerificationCode(verificationCode);
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Generate unique referral code for the new user
    const userReferralCode = await generateUniqueReferralCode();
    
    // Create user without any trial - they must select one after email verification
    const user = await storage.createUser({
      email: data.email,
      username: data.username,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : undefined,
      businessName: data.businessName,
      role: "user",
      tier: "free", // Start as free tier
      credits: 0, // No initial credits until trial selected
      emailVerified: false, // Require email verification
      emailVerificationCode: hashedCode,
      emailVerificationExpiry: verificationExpiry,
      emailVerificationAttempts: 0,
      needsTrialSelection: true, // Must select trial after verification
      // Add referral code for this user
      referralCode: userReferralCode,
    });
    
    // Send verification email
    await sendVerificationEmail(data.email, verificationCode);
    
    // Process referral if provided
    let referralCredits = 0;
    if (data.referralCode) {
      try {
        // Find referrer
        const referrer = await storage.getUserByReferralCode(data.referralCode);
        if (referrer && referrer.id !== user.id) {
          // Create referral record
          const referral = await storage.createReferral({
            referrerId: referrer.id,
            referredUserId: user.id,
            referralCode: data.referralCode,
            creditsEarned: 0,
            status: "pending",
          });

          // Award credits to referrer (100 credits)
          const referrerCredits = 100;
          await storage.updateUser(referrer.id, {
            credits: (referrer.credits || 0) + referrerCredits,
          });

          // Award welcome credits to new user (25 credits)
          referralCredits = 25;
          await storage.updateUser(user.id, {
            credits: (user.credits || 0) + referralCredits,
            referredBy: data.referralCode,
          });

          // Complete the referral
          await storage.completeReferral(referral.id, referrerCredits);

          // Create credit transactions for tracking
          await storage.createCreditTransaction({
            userId: referrer.id,
            amount: referrerCredits,
            type: "referral_bonus",
            description: "Referral bonus for successful referral",
          });

          await storage.createCreditTransaction({
            userId: user.id,
            amount: referralCredits,
            type: "referral_welcome",
            description: "Welcome credits from referral signup",
          });
        }
      } catch (error) {
        console.error("Error processing referral:", error);
        // Don't fail signup if referral processing fails
      }
    }
    
    // Don't create JWT yet - user needs to verify email first
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      businessName: user.businessName,
      tier: user.tier,
      credits: user.credits,
      emailVerified: false,
      requiresVerification: true,
      referralCode: user.referralCode,
      message: 'Account created! Please check your email for verification code.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    console.log('Login attempt for email:', data.email);
    
    // Find user by email
    const user = await storage.getUserByEmail(data.email);
    if (!user) {
      console.log('User not found:', data.email);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    if (!user.password) {
      console.log('User has no password (OAuth user?):', data.email);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Check password
    console.log('Comparing passwords for:', data.email);
    console.log('Received password:', data.password);
    console.log('Stored hash first 20 chars:', user.password.substring(0, 20));
    const isValid = await bcrypt.compare(data.password, user.password);
    console.log('Password comparison result:', isValid);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Check if account is active
    if (user.accountStatus !== "active") {
      return res.status(403).json({ 
        message: `Account is ${user.accountStatus}. Please contact support.` 
      });
    }
    
    // Check if email is verified (for non-OAuth accounts)
    if (!user.emailVerified && user.password) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }
    
    // Update last login
    await storage.updateUser(user.id, { lastLoginAt: new Date() });

    // Create JWT token for authenticated user
    createUserJWT(res, user);

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      businessName: user.businessName,
      tier: user.tier,
      credits: user.credits,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

// Logout endpoint
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie('mam_jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: "Logged out successfully" });
});

// Get current user endpoint
router.get("/me", async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      tier: user.tier,
      credits: user.credits,
      isAdmin: user.isAdmin,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      trialEndDate: user.trialEndDate,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
});

// Check authentication status
router.get("/check", (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  res.json({
    authenticated: !!userId,
    userId: userId || null,
  });
});

// Middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: Function) => {
  const userId = (req as any).user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to check if user's email is verified
export const requireVerifiedEmail = async (req: Request, res: Response, next: Function) => {
  const userId = (req as any).user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Skip verification check for OAuth users (no password)
  if (!user.password) {
    return next();
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      message: "Email verification required",
      requiresVerification: true,
      email: user.email,
    });
  }

  next();
};

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: Function) => {
  const userId = (req as any).user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(userId);
  if (!user || (!user.isAdmin && user.role !== 'admin')) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

export default router;