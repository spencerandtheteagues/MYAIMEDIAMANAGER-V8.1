import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" as any })
  : null;

const router = Router();

// Admin authentication middleware that works with both session and Replit auth
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userId: string | undefined;
    
    // Check for session-based auth first
    if (req.session?.userId) {
      userId = req.session.userId;
    }
    // Check for Replit auth
    else if ((req as any).user?.claims?.sub) {
      userId = (req as any).user.claims.sub;
    }
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Store user info for route handlers
    (req as any).adminUser = user;
    (req as any).adminId = userId;
    
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// All admin routes require admin authentication
router.use(isAdmin);

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching users: " + error.message });
  }
});

// Get specific user
router.get("/users/:id", async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user's credit transactions
    const transactions = await storage.getCreditTransactionsByUserId(user.id);
    const adminActions = await storage.getAdminActionsByTargetUser(user.id);
    
    res.json({ 
      user, 
      transactions,
      adminActions 
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching user: " + error.message });
  }
});

// Update user (admin can update any field)
router.patch("/users/:id", async (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow changing user ID
    delete updates.id;
    
    const updatedUser = await storage.updateUser(id, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Log admin action
    await storage.logAdminAction({
      adminUserId: adminId || null,
      targetUserId: id,
      action: "update_user",
      details: updates,
    });
    
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: "Error updating user: " + error.message });
  }
});

// Grant credits to user
router.post("/users/:id/grant-credits", async (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid credit amount" });
    }
    
    // Create credit transaction
    const transaction = await storage.createCreditTransaction({
      userId: id,
      amount,
      type: "admin_grant",
      description: reason || `Admin granted ${amount} credits`,
      stripePaymentIntentId: null,
    });
    
    // Log admin action
    await storage.logAdminAction({
      adminUserId: adminId || null,
      targetUserId: id,
      action: "grant_credits",
      details: { amount, reason },
    });
    
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: "Error granting credits: " + error.message });
  }
});

// Deduct credits from user
router.post("/users/:id/deduct-credits", async (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid credit amount" });
    }
    
    // Create negative credit transaction
    const transaction = await storage.createCreditTransaction({
      userId: id,
      amount: -amount,
      type: "admin_deduction",
      description: reason || `Admin deducted ${amount} credits`,
      stripePaymentIntentId: null,
    });
    
    // Log admin action
    await storage.logAdminAction({
      adminUserId: adminId || null,
      targetUserId: id,
      action: "deduct_credits",
      details: { amount, reason },
    });
    
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: "Error deducting credits: " + error.message });
  }
});

// Freeze/unfreeze user account
router.post("/users/:id/freeze", async (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { frozen, reason } = req.body;
    
    const user = await storage.updateUser(id, { 
      accountStatus: frozen ? "frozen" : "active" 
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Log admin action
    await storage.logAdminAction({
      adminUserId: adminId || null,
      targetUserId: id,
      action: frozen ? "freeze_account" : "unfreeze_account",
      details: { reason },
    });
    
    res.json({ message: `Account ${frozen ? "frozen" : "unfrozen"}`, user });
  } catch (error: any) {
    res.status(500).json({ message: "Error updating account status: " + error.message });
  }
});

// Change user subscription tier
router.post("/users/:id/change-tier", async (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { tier, grantCredits } = req.body;
    
    const plan = await storage.getSubscriptionPlanByTier(tier);
    if (!plan) {
      return res.status(400).json({ message: "Invalid subscription tier" });
    }
    
    const user = await storage.updateUser(id, { tier });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Optionally grant the plan's monthly credits
    if (grantCredits) {
      await storage.createCreditTransaction({
        userId: id,
        amount: plan.creditsPerMonth,
        type: "admin_grant",
        description: `Admin changed tier to ${plan.name} with credits`,
        stripePaymentIntentId: null,
      });
    }
    
    // Log admin action
    await storage.logAdminAction({
      adminUserId: adminId || null,
      targetUserId: id,
      action: "change_tier",
      details: { tier, grantCredits },
    });
    
    res.json({ message: "Tier updated", user });
  } catch (error: any) {
    res.status(500).json({ message: "Error changing tier: " + error.message });
  }
});

// Delete user account
router.delete("/users/:id", async (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const adminId = (req as any).adminId;
    const { id } = req.params;
    
    // Prevent deleting admin accounts
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    }
    
    // Mark as deleted instead of actually deleting
    await storage.updateUser(id, { 
      accountStatus: "deleted"
    });
    
    // Log admin action
    await storage.logAdminAction({
      adminUserId: adminId || null,
      targetUserId: id,
      action: "delete_account",
      details: {},
    });
    
    res.json({ message: "User account deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting user: " + error.message });
  }
});

// Process refund
router.post("/refund", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }
    
    const adminUser = (req as any).adminUser;
    const adminId = (req as any).adminId;
    const { userId, amount, reason, stripePaymentIntentId } = req.body;
    
    if (!stripePaymentIntentId) {
      return res.status(400).json({ message: "Payment intent ID required for refund" });
    }
    
    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
      reason: "requested_by_customer",
      metadata: {
        adminId,
        userId,
        reason,
      },
    });
    
    // Deduct credits if refunding a credit purchase
    if (userId) {
      const creditAmount = Math.round(amount * 10); // $0.10 per credit
      await storage.createCreditTransaction({
        userId,
        amount: -creditAmount,
        type: "refund",
        description: `Refund processed: ${reason}`,
        stripePaymentIntentId,
      });
      
      // Log admin action
      await storage.logAdminAction({
        adminUserId: adminId || null,
        targetUserId: userId,
        action: "process_refund",
        details: { amount, reason, refundId: refund.id },
      });
    }
    
    res.json({ message: "Refund processed", refund });
  } catch (error: any) {
    res.status(500).json({ message: "Error processing refund: " + error.message });
  }
});

// Get all credit transactions
router.get("/transactions", async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    const allTransactions = [];
    
    for (const user of users) {
      const userTransactions = await storage.getCreditTransactionsByUserId(user.id);
      allTransactions.push(...userTransactions.map(t => ({
        ...t,
        userName: user.fullName || user.username,
        userEmail: user.email,
      })));
    }
    
    // Sort by date, most recent first
    allTransactions.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
    
    res.json(allTransactions);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching transactions: " + error.message });
  }
});

// Get system stats
router.get("/stats", async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    const plans = await storage.getSubscriptionPlans();
    
    // Calculate stats
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.accountStatus === "active").length,
      frozenUsers: users.filter(u => u.accountStatus === "frozen").length,
      usersByTier: {
        free: users.filter(u => u.tier === "free").length,
        basic: users.filter(u => u.tier === "basic").length,
        pro: users.filter(u => u.tier === "pro").length,
        enterprise: users.filter(u => u.tier === "enterprise").length,
      },
      totalCreditsInSystem: users.reduce((sum, u) => sum + (u.credits || 0), 0),
      averageCreditsPerUser: Math.round(
        users.reduce((sum, u) => sum + (u.credits || 0), 0) / users.length
      ),
      subscriptionPlans: plans,
    };
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching stats: " + error.message });
  }
});

export default router;