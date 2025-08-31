import type { Express } from "express";
import { storage } from "./storage";
import crypto from "crypto";

// Admin credentials - hardcoded for special admin user
const ADMIN_EMAIL = "spencerandtheteagues@gmail.com";
const ADMIN_PASSWORD = "TheMoonKey8!";

// Hash password using SHA256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function registerAdminRoutes(app: Express) {
  // Admin login route - bypasses OAuth
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate admin credentials
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Get or create admin user
      let adminUser = await storage.getUserByEmail(ADMIN_EMAIL);
      
      if (!adminUser) {
        // Create admin user with infinite credits - use upsertUser for full field support
        adminUser = await storage.upsertUser({
          id: "admin-user-1",
          email: ADMIN_EMAIL,
          firstName: "Admin",
          lastName: "User",
          businessName: "Platform Administrator",
          credits: 999999999, // Infinite credits
          isAdmin: true,
          adminPassword: hashPassword(ADMIN_PASSWORD),
          subscriptionStatus: "enterprise", // Highest tier
          subscriptionId: "enterprise",
        });
      } else {
        // Update existing user to be admin if not already
        if (!adminUser.isAdmin) {
          await storage.updateUser(adminUser.id, {
            isAdmin: true,
            adminPassword: hashPassword(ADMIN_PASSWORD),
            credits: 999999999,
            subscriptionStatus: "enterprise",
            subscriptionId: "enterprise",
          });
          adminUser = await storage.getUserByEmail(ADMIN_EMAIL);
        }
      }

      // Create session for admin
      (req.session as any).userId = adminUser!.id;
      (req.session as any).isAdmin = true;
      
      // Set user in request for authentication
      (req as any).user = {
        claims: {
          sub: adminUser!.id,
          email: adminUser!.email,
        },
      };

      // Save session
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        res.json({
          message: "Admin login successful",
          user: {
            ...adminUser,
            adminPassword: undefined, // Don't send password hash to client
          },
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin check middleware
  app.get("/api/admin/check", async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.json({ isAdmin: false });
      }

      const user = await storage.getUser(userId);
      res.json({ 
        isAdmin: user?.isAdmin || false,
        user: user ? { ...user, adminPassword: undefined } : null
      });
    } catch (error) {
      res.json({ isAdmin: false });
    }
  });

  // Admin-only route to manage users
  app.get("/api/admin/users", async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const adminUser = await storage.getUser(userId);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all users for admin dashboard
      const users = await storage.getAllUsers();
      
      // Remove sensitive data
      const sanitizedUsers = users.map(user => ({
        ...user,
        adminPassword: undefined,
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin route to update user credits
  app.post("/api/admin/users/:userId/credits", async (req: any, res) => {
    try {
      const adminUserId = req.session?.userId || req.user?.claims?.sub;
      
      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const adminUser = await storage.getUser(adminUserId);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { credits, description } = req.body;

      await storage.updateUserCredits(
        userId,
        credits,
        description || "Admin credit adjustment",
        "admin"
      );

      const updatedUser = await storage.getUser(userId);
      res.json({ 
        message: "Credits updated successfully",
        user: { ...updatedUser, adminPassword: undefined }
      });
    } catch (error) {
      console.error("Error updating credits:", error);
      res.status(500).json({ message: "Failed to update credits" });
    }
  });

  // Admin route to delete user
  app.delete("/api/admin/users/:userId", async (req: any, res) => {
    try {
      const adminUserId = req.session?.userId || req.user?.claims?.sub;
      
      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const adminUser = await storage.getUser(adminUserId);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === adminUserId) {
        return res.status(400).json({ message: "Cannot delete your own admin account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
}

// Middleware to check if user is admin
export async function isAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.session?.userId || req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Authorization check failed" });
  }
}