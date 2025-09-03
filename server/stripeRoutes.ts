import { Router } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil" as any,
});

const router = Router();

// Get subscription plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching plans: " + error.message });
  }
});

// Create subscription
router.post("/create-subscription", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { tier } = req.body;
    const plan = await storage.getSubscriptionPlanByTier(tier);
    
    if (!plan) {
      return res.status(400).json({ message: "Invalid subscription tier" });
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

    // Create subscription with trial if applicable
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: `${plan.creditsPerMonth} credits per month`,
          },
          unit_amount: Math.round(parseFloat(plan.priceMonthly) * 100),
          recurring: {
            interval: 'month',
          },
        },
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user subscription info
    await storage.updateUser(userId, {
      stripeSubscriptionId: subscription.id,
      tier: plan.tier,
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = (latestInvoice as any).payment_intent as Stripe.PaymentIntent;

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error creating subscription: " + error.message });
  }
});

// Cancel subscription
router.post("/cancel-subscription", isAuthenticated, async (req, res) => {
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
router.post("/purchase-credits", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub;
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

export default router;