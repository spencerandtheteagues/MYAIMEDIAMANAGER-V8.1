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

// Get subscription plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching plans: " + error.message });
  }
});

// Start Pro trial (requires card)
router.post("/start-pro-trial", requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub || user.id;
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or retrieve Stripe customer
    let customerId = dbUser.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
        name: dbUser.fullName || undefined,
        metadata: {
          userId: dbUser.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId: customerId });
    }

    // Create a setup session to collect card details for Pro trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/?proTrialStarted=true`,
      cancel_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/trial`,
      metadata: {
        userId: dbUser.id,
        action: 'start_pro_trial'
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating pro trial session:", error);
    res.status(500).json({ message: "Error creating pro trial session: " + error.message });
  }
});

// Upgrade trial by adding card
router.post("/upgrade-trial", requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub || user.id;
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or retrieve Stripe customer
    let customerId = dbUser.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
        name: dbUser.fullName || undefined,
        metadata: {
          userId: dbUser.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId: customerId });
    }

    // Create a setup session to collect card details
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/?trialUpgraded=true`,
      cancel_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/`,
      metadata: {
        userId: dbUser.id,
        action: 'upgrade_trial'
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating upgrade session:", error);
    res.status(500).json({ message: "Error creating upgrade session: " + error.message });
  }
});

// NOTE: Checkout sessions are now handled by the custom checkout page at /checkout
// Old Stripe checkout endpoint removed - use /checkout route instead

// NOTE: Subscription creation is now handled via custom checkout page
// Old create-subscription endpoint removed - subscriptions are created via webhooks after checkout

// Cancel subscription
router.post("/cancel-subscription", requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser || !dbUser.stripeSubscriptionId) {
      return res.status(400).json({ message: "No active subscription" });
    }

    const subscription = await stripe.subscriptions.cancel(dbUser.stripeSubscriptionId);
    
    // Update user to free tier
    await storage.updateUser(userId, {
      stripeSubscriptionId: null,
      tier: "free",
    });

    res.json({ message: "Subscription cancelled", subscription });
  } catch (error: any) {
    res.status(500).json({ message: "Error cancelling subscription: " + error.message });
  }
});

// Purchase credits (pay-as-you-go)
router.post("/purchase-credits", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { amount } = req.body; // Number of credits to purchase
    
    if (!amount || amount < 10) {
      return res.status(400).json({ message: "Minimum purchase is 10 credits" });
    }

    const dbUser = await storage.getUser(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // $0.10 per credit
    const priceInCents = amount * 10;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceInCents,
      currency: "usd",
      metadata: {
        userId,
        credits: amount.toString(),
        type: "credit_purchase"
      }
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      credits: amount,
      price: priceInCents / 100
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error creating payment: " + error.message });
  }
});

// Webhook to handle successful payments
router.post("/webhook", async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).send('No signature');
  }

  let event: Stripe.Event;

  try {
    // You'll need to set STRIPE_WEBHOOK_SECRET in production
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'your_webhook_secret';
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Handle Pro trial start or trial upgrade
      if (session.metadata?.action === 'start_pro_trial' || session.metadata?.action === 'upgrade_trial') {
        const userId = session.metadata.userId;
        const user = await storage.getUser(userId);
        if (user) {
          const now = new Date();
          const trialDays = 14; // Pro trial is 14 days
          const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
          
          await storage.updateUser(userId, {
            trialVariant: 'card14',
            trialStartedAt: now,
            trialEndsAt: trialEndsAt,
            trialImagesRemaining: TRIAL_ALLOCATIONS.card14.images,
            trialVideosRemaining: TRIAL_ALLOCATIONS.card14.videos,
            cardOnFile: true,
            tier: 'free_trial',
          });
        }
      }
      
      // Handle subscription purchase
      if (session.metadata?.tier) {
        const userId = session.metadata.userId;
        const tier = session.metadata.tier;
        
        await storage.updateUser(userId, {
          tier: tier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          subscriptionStatus: 'active',
        });
      }
      break;
      
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      if (paymentIntent.metadata.type === 'credit_purchase') {
        const userId = paymentIntent.metadata.userId;
        const credits = parseInt(paymentIntent.metadata.credits);
        
        // Add credits to user account
        await storage.createCreditTransaction({
          userId,
          amount: credits,
          type: 'purchase',
          description: `Purchased ${credits} credits`,
          stripePaymentIntentId: paymentIntent.id,
        });
      }
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Find user by Stripe customer ID
      const users = await storage.getAllUsers();
      const user = users.find(u => u.stripeCustomerId === customerId);
      
      if (user) {
        // Get plan details from subscription
        const priceId = subscription.items.data[0].price.id;
        
        // Award monthly credits based on subscription
        if (subscription.status === 'active') {
          const plan = await storage.getSubscriptionPlanByTier(user.tier || 'free');
          if (plan) {
            await storage.createCreditTransaction({
              userId: user.id,
              amount: plan.creditsPerMonth,
              type: 'subscription',
              description: `Monthly ${plan.name} subscription credits`,
              stripePaymentIntentId: null,
            });
          }
        }
      }
      break;

    case 'customer.subscription.deleted':
      const cancelledSub = event.data.object as Stripe.Subscription;
      const cancelledCustomerId = cancelledSub.customer as string;
      
      // Find user and update to free tier
      const allUsers = await storage.getAllUsers();
      const cancelledUser = allUsers.find(u => u.stripeCustomerId === cancelledCustomerId);
      
      if (cancelledUser) {
        await storage.updateUser(cancelledUser.id, {
          stripeSubscriptionId: null,
          tier: 'free',
        });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// New route for subscription upgrade
router.post("/upgrade", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { planId } = req.body;
    
    const dbUser = await storage.getUser(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Plan details
    const plans: Record<string, { price: number, name: string, credits: number }> = {
      'starter': { price: 19, name: 'Starter Plan', credits: 190 },
      'professional': { price: 49, name: 'Professional Plan', credits: 500 },
      'business': { price: 199, name: 'Business Plan', credits: 2000 },
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }

    // Create or retrieve Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
        name: dbUser.fullName || undefined,
        metadata: {
          userId: dbUser.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId: customerId });
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            metadata: {
              tier: planId,
              credits: plan.credits.toString()
            }
          },
          unit_amount: plan.price * 100,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      success_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/settings?upgraded=true`,
      cancel_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/settings`,
      metadata: {
        userId: dbUser.id,
        action: 'upgrade_subscription',
        tier: planId
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating upgrade session:", error);
    res.status(500).json({ message: "Error creating upgrade session: " + error.message });
  }
});

// Cancel subscription (at period end)
router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !dbUser.stripeSubscriptionId) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      dbUser.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    );

    // Update user in database
    await storage.updateUser(userId, {
      subscriptionStatus: 'cancelled'
    });

    res.json({ 
      message: "Subscription cancelled successfully",
      endsAt: new Date((subscription as any).current_period_end * 1000)
    });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Error cancelling subscription: " + error.message });
  }
});

// Custom checkout with monthly/yearly pricing (supports embedded mode)
router.post("/custom-checkout", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { planId, billingCycle, price, mode = 'hosted' } = req.body;
    
    const dbUser = await storage.getUser(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Plan details with monthly and yearly pricing
    const plans: Record<string, { 
      name: string, 
      monthlyPrice: number, 
      yearlyPrice: number,
      credits: number 
    }> = {
      'starter': { 
        name: 'Starter Plan', 
        monthlyPrice: 19, 
        yearlyPrice: 199,
        credits: 190 
      },
      'professional': { 
        name: 'Professional Plan', 
        monthlyPrice: 49, 
        yearlyPrice: 499,
        credits: 500 
      },
      'business': { 
        name: 'Business Plan', 
        monthlyPrice: 199, 
        yearlyPrice: 1999,
        credits: 2000 
      },
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }

    // Validate price matches expected
    const expectedPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    if (price !== expectedPrice) {
      return res.status(400).json({ message: "Invalid price for selected plan" });
    }

    // Create or retrieve Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
        name: dbUser.fullName || undefined,
        metadata: {
          userId: dbUser.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId: customerId });
    }

    // Create checkout session params
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${plan.name} (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
            description: `${plan.credits} credits per month`,
            metadata: {
              tier: planId,
              credits: plan.credits.toString(),
              billingCycle
            }
          },
          unit_amount: price * 100,
          recurring: {
            interval: billingCycle === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      metadata: {
        userId: dbUser.id,
        tier: planId,
        billingCycle,
        action: 'subscription'
      }
    };

    // Set up for embedded mode or hosted mode
    if (mode === 'embedded') {
      sessionParams.ui_mode = 'embedded';
      sessionParams.return_url = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionParams.success_url = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/?subscribed=true`;
      sessionParams.cancel_url = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/checkout?plan=${planId}`;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return appropriate response based on mode
    if (mode === 'embedded') {
      res.json({ clientSecret: session.client_secret });
    } else {
      res.json({ url: session.url });
    }
  } catch (error: any) {
    console.error("Error creating custom checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session: " + error.message });
  }
});

// Pro trial checkout ($1 verification)
router.post("/pro-trial", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { mode = 'hosted' } = req.body;
    
    const dbUser = await storage.getUser(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or retrieve Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
        name: dbUser.fullName || undefined,
        metadata: {
          userId: dbUser.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId: customerId });
    }

    // Create checkout session params for $1 verification
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Professional Plan Trial',
            description: 'Card verification for 14-day Pro trial with 500 credits'
          },
          unit_amount: 100, // $1.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: {
        userId: dbUser.id,
        action: 'pro_trial',
        tier: 'professional'
      }
    };

    // Set up for embedded mode or hosted mode
    if (mode === 'embedded') {
      sessionParams.ui_mode = 'embedded';
      sessionParams.return_url = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionParams.success_url = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/?trial=pro_started`;
      sessionParams.cancel_url = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/trial-selection`;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return appropriate response based on mode
    if (mode === 'embedded') {
      res.json({ clientSecret: session.client_secret });
    } else {
      res.json({ url: session.url });
    }
  } catch (error: any) {
    console.error("Error creating Pro trial session:", error);
    res.status(500).json({ message: "Error creating trial session: " + error.message });
  }
});

// Get checkout session status (for embedded return page)
router.get("/session-status/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
    });
  } catch (error: any) {
    console.error("Error retrieving session:", error);
    res.status(500).json({ message: "Error retrieving session: " + error.message });
  }
});

// Purchase credits with different pack options
router.post("/purchase", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { credits, price } = req.body;
    
    // Validate credit pack
    const validPacks = [
      { credits: 50, price: 5 },
      { credits: 200, price: 18 },
      { credits: 500, price: 40 }
    ];
    
    const pack = validPacks.find(p => p.credits === credits && p.price === price);
    if (!pack) {
      return res.status(400).json({ message: "Invalid credit pack" });
    }

    const dbUser = await storage.getUser(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or retrieve Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
        name: dbUser.fullName || undefined,
        metadata: {
          userId: dbUser.id
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId: customerId });
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pack.credits} AI Credits`,
            description: `Add ${pack.credits} credits to your account`
          },
          unit_amount: pack.price * 100,
        },
        quantity: 1,
      }],
      success_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/settings?credits_added=true`,
      cancel_url: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/settings`,
      metadata: {
        userId: dbUser.id,
        action: 'purchase_credits',
        credits: pack.credits.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating credit purchase session:", error);
    res.status(500).json({ message: "Error creating purchase session: " + error.message });
  }
});

export default router;