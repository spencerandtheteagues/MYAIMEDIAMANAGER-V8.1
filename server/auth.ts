import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { z } from "zod";
import type { User } from "@shared/schema";

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(100),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  businessName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

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
    
    // Set up no-card trial for new users
    const now = new Date();
    const trialDays = 7;
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    
    // Create user with automatic no-card trial
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
      tier: "free_trial",
      credits: 50, // Initial free credits
      // Automatically assign no-card trial
      trialVariant: "nocard7",
      trialStartedAt: now,
      trialEndsAt: trialEndsAt,
      trialImagesRemaining: 6,
      trialVideosRemaining: 0,
      isNewUser: true, // Flag to show welcome popup
    });
    
    // Create session
    createUserSession(req, user);
    
    // Save session
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Failed to create session" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        businessName: user.businessName,
        tier: user.tier,
        credits: user.credits,
      });
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
    
    // Find user by email
    const user = await storage.getUserByEmail(data.email);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Check password
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Check if account is active
    if (user.accountStatus !== "active") {
      return res.status(403).json({ 
        message: `Account is ${user.accountStatus}. Please contact support.` 
      });
    }
    
    // Update last login
    await storage.updateUser(user.id, { lastLoginAt: new Date() });
    
    // Create session
    createUserSession(req, user);
    
    // Save session
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Failed to create session" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        businessName: user.businessName,
        tier: user.tier,
        credits: user.credits,
        isAdmin: user.isAdmin,
      });
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
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user endpoint
router.get("/me", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
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
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
});

// Check authentication status
router.get("/check", (req: Request, res: Response) => {
  res.json({ 
    authenticated: !!req.session.userId,
    userId: req.session.userId || null,
  });
});

// Middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to check if user is admin
export const requireAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

export default router;