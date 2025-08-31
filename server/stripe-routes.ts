import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  }) : null;

export function registerStripeRoutes(app: Express) {
  // Create subscription with Stripe
  app.post("/api/create-subscription", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not configured" });
    }

    try {
      const userId = req.user?.claims?.sub;
      const { planId, billingCycle } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get plan details
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: userId,
            businessName: user.businessName || ''
          }
        });
        stripeCustomerId = customer.id;
        // Update user with Stripe customer ID
        const updatedUser = await storage.getUser(userId);
        if (updatedUser) {
          updatedUser.stripeCustomerId = stripeCustomerId;
        }
      }

      const amount = billingCycle === 'monthly' ? 
        parseFloat(plan.monthlyPrice.toString()) : 
        parseFloat(plan.yearlyPrice.toString());

      // Create subscription with trial for free plan
      const trialDays = planId === 'free' ? 7 : 0;
      
      // Create price data inline
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ 
          price_data: {
            currency: 'usd',
            product: plan.displayName,
            unit_amount: Math.round(amount * 100),
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year'
            }
          } as any
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: trialDays,
        metadata: {
          userId,
          planId,
          billingCycle
        }
      });

      const invoice = (subscription as any).latest_invoice as Stripe.Invoice;
      const paymentIntent = (invoice as any)?.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || '',
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      res.status(500).json({ 
        message: "Error creating subscription",
        error: error.message 
      });
    }
  });

  // Verify subscription after payment
  app.post("/api/verify-subscription", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not configured" });
    }

    try {
      const userId = req.user?.claims?.sub;
      const { paymentIntent: paymentIntentId } = req.body;

      // Retrieve payment intent to verify
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          success: false,
          message: "Payment not completed" 
        });
      }

      // Get subscription from payment intent metadata
      const invoiceId = (paymentIntent as any).invoice as string;
      if (!invoiceId) {
        return res.status(400).json({ 
          success: false,
          message: "No invoice found" 
        });
      }

      const invoice = await stripe.invoices.retrieve(invoiceId);
      const subscriptionId = (invoice as any).subscription as string;
      
      if (!subscriptionId) {
        return res.status(400).json({ 
          success: false,
          message: "No subscription found" 
        });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Update user with subscription details
      const planId = subscription.metadata.planId;
      const billingCycle = subscription.metadata.billingCycle;
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Calculate end date
      const endDate = new Date((subscription as any).current_period_end * 1000);
      
      // Update user subscription in database
      const user = await storage.getUser(userId);
      if (user) {
        user.stripeSubscriptionId = subscription.id;
        user.subscriptionId = planId;
        user.subscriptionStatus = subscription.status === 'trialing' ? 'trial' : 'active';
        user.subscriptionEndDate = endDate;
        user.trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
      }

      // Create subscription record
      await storage.createUserSubscription({
        userId,
        planId,
        status: subscription.status === 'trialing' ? 'trial' : 'active',
        billingCycle: billingCycle as 'monthly' | 'yearly',
        startDate: new Date(subscription.start_date * 1000),
        endDate,
        nextBillingDate: endDate,
        autoRenew: true,
        cancelledAt: null,
      });

      // Add credits to user account
      await storage.updateUserCredits(
        userId,
        plan.creditsPerMonth,
        `${plan.displayName} subscription activated`,
        "subscription"
      );

      res.json({
        success: true,
        subscription: {
          planName: plan.displayName,
          billingCycle,
          credits: plan.creditsPerMonth,
          nextBillingDate: endDate
        }
      });
    } catch (error: any) {
      console.error("Subscription verification error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to verify subscription",
        error: error.message 
      });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not configured" });
    }

    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      // Cancel at period end (user keeps access until end of billing period)
      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      // Update user status
      if (user) {
        user.subscriptionStatus = 'cancelled';
      }

      res.json({
        message: "Subscription cancelled successfully",
        endsAt: new Date((subscription as any).current_period_end * 1000)
      });
    } catch (error: any) {
      console.error("Subscription cancellation error:", error);
      res.status(500).json({ 
        message: "Failed to cancel subscription",
        error: error.message 
      });
    }
  });
}