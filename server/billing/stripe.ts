import { Router } from "express";
import Stripe from "stripe";
import { storage } from "../storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
export const billingRouter = Router();

billingRouter.post("/micropack", async (req:any,res:any)=>{
  if(!req.user?.id) return res.status(401).json({ error:"AUTH_REQUIRED" });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: 500,
        product_data: { name: "50 Credit Micro Pack" }
      },
      quantity: 1
    }],
    success_url: `${process.env.PUBLIC_URL}/billing/success`,
    cancel_url: `${process.env.PUBLIC_URL}/billing/cancel`,
    metadata: { userId: req.user.id, credits: "50" }
  });
  res.json({ url: session.url });
});

billingRouter.post("/webhook", async (req:any,res:any)=>{
  let event: Stripe.Event;
  try{
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  }catch(e:any){
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  if (event.type === "checkout.session.completed"){
    const cs = event.data.object as Stripe.Checkout.Session;
    const userId = cs.metadata?.userId;
    const credits = Number(cs.metadata?.credits || 0);
    if (userId && credits>0){
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, {
          credits: (user.credits || 0) + credits,
          totalCreditsUsed: user.totalCreditsUsed || 0
        });
      }
    }
  }
  res.json({ received: true });
});