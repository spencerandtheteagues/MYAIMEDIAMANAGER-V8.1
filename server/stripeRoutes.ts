import { Router } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { TRIAL_ALLOCATIONS } from "../shared/credits";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil" as any,
});

const router = Router();

// Helper function to get user ID from request
function getUserId(req: any): string | null {
  if (req.session?.userId) return req.session.userId;
  if (req.user?.id) return req.user.id;
  if (req.user?.claims?.sub) return req.user.claims.sub;
  return null;
}

// Simple authentication middleware that works with both auth systems
const requireAuth = async (req: any, res: any, next: any) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

// Get the base URL for redirects
function getBaseUrl(req: any): string {
  if (process.env.REPLIT_DOMAINS) {
    const firstDomain = process.env.REPLIT_DOMAINS.split(',')[0];
    return `https://${firstDomain}`;
  }
  return `http://localhost:${process.env.PORT || 5000}`;
}

// Define pricing for plans (in cents)
const PLAN_PRICES = {
  starter: {
    price: 1900, // $19
    name: "Starter Plan",
    description: "190 credits per month",
    credits: 190
  },
  professional: {
    price: 4900, // $49
    name: "Professional Plan", 
    description: "500 credits per month",
    credits: 500
  },
  business: {
    price: 19900, // $199
    name: "Business Plan",
    description: "2000 credits per month",
    credits: 2000
  }
};

// Create a Stripe-hosted checkout session for subscription
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { planId } = req.body;
    
    if (!planId || !PLAN_PRICES[planId as keyof typeof PLAN_PRICES]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }
    
    const plan = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
    const user = await storage.getUser(userId!);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.fullName || undefined,
        metadata: {
          userId: user.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId!, { stripeCustomerId: customerId });
    }

    const baseUrl = getBaseUrl(req);
    
    // Create Stripe checkout session with mode=subscription for recurring payments
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.price,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId: user.id,
        planId: planId,
        credits: plan.credits.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session: " + error.message });
  }
});

// Create a one-time payment checkout session for credit packs
router.post("/create-credit-checkout", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { credits } = req.body;
    
    if (!credits || credits < 10) {
      return res.status(400).json({ message: "Minimum 10 credits required" });
    }
    
    const user = await storage.getUser(userId!);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.fullName || undefined,
        metadata: {
          userId: user.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId!, { stripeCustomerId: customerId });
    }

    const baseUrl = getBaseUrl(req);
    const pricePerCredit = 10; // 10 cents per credit
    
    // Create Stripe checkout session with mode=payment for one-time purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${credits} AI Credits`,
            description: `One-time purchase of ${credits} credits for AI content generation`,
          },
          unit_amount: credits * pricePerCredit,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing`,
      metadata: {
        userId: user.id,
        type: 'credits',
        credits: credits.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating credit checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session: " + error.message });
  }
});

// Retrieve checkout session status
router.get("/session-status/:sessionId", requireAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    
    res.json({
      status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency
    });
  } catch (error: any) {
    console.error("Error retrieving session:", error);
    res.status(500).json({ message: "Error retrieving session: " + error.message });
  }
});

// Webhook endpoint moved to separate file (stripe-webhook.ts) 
// to handle raw body parsing before JSON middleware

// Cancel subscription
router.post("/cancel-subscription", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await storage.getUser(userId!);
    
    if (!user || !user.stripeSubscriptionId) {
      return res.status(400).json({ message: "No active subscription found" });
    }
    
    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    res.json({ 
      message: "Subscription will be cancelled at the end of the billing period",
      cancelAt: subscription.cancel_at
    });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Error cancelling subscription: " + error.message });
  }
});

// Get subscription plans (for display purposes)
router.get("/plans", async (req, res) => {
  try {
    const plans = Object.entries(PLAN_PRICES).map(([id, details]) => ({
      id,
      name: details.name,
      price: details.price / 100, // Convert to dollars
      credits: details.credits,
      description: details.description
    }));
    
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching plans: " + error.message });
  }
});

export default router;