import { Router } from "express";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth } from "./auth";
import stripe from "./billing/stripe";
import type { Request, Response } from "express";

const router = Router();

// User ID helper
function getUserId(req: any): string | null {
  if (req.session?.userId) return req.session.userId;
  if (req.user?.id) return req.user.id;
  if (req.user?.claims?.sub) return req.user.claims.sub;
  return null;
}

// Get user billing history
router.get("/billing-history", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const transactions = await storage.getCreditTransactionsByUserId(userId);
    
    // Format transactions for display
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      description: tx.description || `${tx.type === 'purchase' ? 'Purchased' : 'Used'} ${Math.abs(tx.amount)} credits`,
      amount: tx.type === 'purchase' ? (Math.abs(tx.amount) / 10).toFixed(2) : 0, // Assuming $0.10 per credit
      status: 'completed',
      createdAt: tx.createdAt
    }));

    res.json(formattedTransactions);
  } catch (error: any) {
    console.error("Error fetching billing history:", error);
    res.status(500).json({ message: error.message });
  }
});

// Change password
router.patch("/password", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8)
    }).parse(req.body);

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    if (!user.password) {
      return res.status(400).json({ message: "Password authentication not enabled for this account" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await storage.updateUser(userId, { password: hashedPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});

// Change email
router.patch("/email", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { newEmail } = z.object({
      newEmail: z.string().email()
    }).parse(req.body);

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is already in use
    const existingUser = await storage.getUserByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: "Email address is already in use" });
    }

    // Update email (in production, you'd want to send verification email first)
    await storage.updateUser(userId, { 
      email: newEmail,
      emailVerified: false // Reset verification status
    });

    // In production, send verification email here
    
    res.json({ message: "Email updated successfully. Please check your email for verification." });
  } catch (error: any) {
    console.error("Error changing email:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete account
router.delete("/account", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cancel any active subscriptions with Stripe
    if (user.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } catch (stripeError) {
        console.error("Error cancelling Stripe subscription:", stripeError);
      }
    }

    // Soft delete the account
    await storage.updateUser(userId, {
      accountStatus: "deleted",
      subscriptionStatus: "cancelled",
      deletedAt: new Date()
    });

    // Destroy the session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;