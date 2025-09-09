import { db } from "../server/db";
import { users, subscriptionPlans, platforms } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Clear existing data (be careful in production!)
    await db.delete(platforms);
    await db.delete(subscriptionPlans);
    await db.delete(users);
    
    // Create demo user
    const demoUser = await db.insert(users).values({
      email: "spencer@myaimediamgr.com",
      username: "spencer.teague",
      password: "$2a$10$rBiVl1x7aW7C7OQkVRysNeDxHHRfN.V6JbcF5gzyDR.EyXp6lPGbm", // "Demo1234!"
      firstName: "Spencer",
      lastName: "Teague",
      fullName: "Spencer Teague",
      businessName: "Spencer's Gourmet Kitchen",
      role: "admin",
      isAdmin: true,
      tier: "professional",
      subscriptionStatus: "active",
      credits: 500,
      freeCreditsUsed: false,
      isPaid: true,
    }).returning();
    
    console.log("Created demo user:", demoUser[0].email);

    // Create subscription plans
    const plans = await db.insert(subscriptionPlans).values([
      {
        name: "Free",
        tier: "free",
        priceMonthly: "0",
        creditsPerMonth: 10,
        features: {
          maxPosts: 5,
          aiAssistant: false,
          analytics: "basic",
          platforms: 1
        },
        maxCampaigns: 1,
        hasVideoGeneration: false,
        hasAiAssistant: false
      },
      {
        name: "Starter",
        tier: "starter",
        priceMonthly: "29",
        creditsPerMonth: 100,
        stripePriceId: "price_starter_monthly",
        features: {
          maxPosts: 50,
          aiAssistant: true,
          analytics: "advanced",
          platforms: 3
        },
        maxCampaigns: 5,
        hasVideoGeneration: false,
        hasAiAssistant: true
      },
      {
        name: "Professional",
        tier: "professional",
        priceMonthly: "99",
        creditsPerMonth: 500,
        stripePriceId: "price_professional_monthly",
        features: {
          maxPosts: 200,
          aiAssistant: true,
          analytics: "advanced",
          platforms: 5,
          videoGeneration: true
        },
        maxCampaigns: 20,
        hasVideoGeneration: true,
        hasAiAssistant: true
      },
      {
        name: "Enterprise",
        tier: "enterprise",
        priceMonthly: "299",
        creditsPerMonth: 2000,
        stripePriceId: "price_enterprise_monthly",
        features: {
          maxPosts: "unlimited",
          aiAssistant: true,
          analytics: "advanced",
          platforms: "unlimited",
          videoGeneration: true,
          prioritySupport: true
        },
        maxCampaigns: null, // unlimited
        hasVideoGeneration: true,
        hasAiAssistant: true
      },
      {
        name: "Pay as You Go",
        tier: "pay_as_you_go",
        priceMonthly: "0",
        creditsPerMonth: 0, // Purchase credits as needed
        features: {
          maxPosts: "unlimited",
          aiAssistant: true,
          analytics: "advanced",
          platforms: "unlimited",
          videoGeneration: true
        },
        maxCampaigns: null,
        hasVideoGeneration: true,
        hasAiAssistant: true
      }
    ]).returning();
    
    console.log(`Created ${plans.length} subscription plans`);

    // Create platform configurations for demo user
    const platformConfigs = await db.insert(platforms).values([
      {
        name: "Instagram",
        icon: "SiInstagram",
        color: "#E4405F",
        isConnected: false,
        userId: demoUser[0].id
      },
      {
        name: "Facebook",
        icon: "SiFacebook",
        color: "#1877F2",
        isConnected: false,
        userId: demoUser[0].id
      },
      {
        name: "X",
        icon: "SiX",
        color: "#000000",
        isConnected: false,
        userId: demoUser[0].id
      },
      {
        name: "TikTok",
        icon: "SiTiktok",
        color: "#000000",
        isConnected: false,
        userId: demoUser[0].id
      },
      {
        name: "LinkedIn",
        icon: "SiLinkedin",
        color: "#0A66C2",
        isConnected: false,
        userId: demoUser[0].id
      }
    ]).returning();
    
    console.log(`Created ${platformConfigs.length} platform configurations`);

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seed().then(() => process.exit(0));