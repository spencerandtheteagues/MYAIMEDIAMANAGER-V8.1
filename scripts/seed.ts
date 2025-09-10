import { db } from "../server/db";
import { users, subscriptionPlans, platforms } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Clear existing data (be careful in production!)
    await db.delete(platforms);
    await db.delete(subscriptionPlans);
    await db.delete(users);
    
    // Hash passwords for admin accounts
    const spencerPassword = await bcrypt.hash("TheMoonKey8!", 10);
    const jaysonPassword = await bcrypt.hash("IllEatIt420", 10);
    
    // Create first admin account
    const spencerAdmin = await db.insert(users).values({
      email: "spencerandtheteagues@gmail.com",
      username: "spencer.admin",
      password: spencerPassword,
      firstName: "Spencer",
      lastName: "Teague",
      fullName: "Spencer Teague",
      businessName: "Spencer's Business",
      role: "admin",
      isAdmin: true,
      tier: "enterprise",
      subscriptionStatus: "active",
      credits: 5000,
      freeCreditsUsed: false,
      isPaid: true,
      accountStatus: "active",
    }).returning();
    
    console.log("Created admin user:", spencerAdmin[0].email);
    
    // Create second admin account
    const jaysonAdmin = await db.insert(users).values({
      email: "jaysonpowers505@gmail.com",
      username: "jayson.admin",
      password: jaysonPassword,
      firstName: "Jayson",
      lastName: "Powers",
      fullName: "Jayson Powers",
      businessName: "Jayson's Business",
      role: "admin",
      isAdmin: true,
      tier: "enterprise",
      subscriptionStatus: "active",
      credits: 5000,
      freeCreditsUsed: false,
      isPaid: true,
      accountStatus: "active",
    }).returning();
    
    console.log("Created admin user:", jaysonAdmin[0].email);

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

    // Create platform configurations for both admin users
    const adminUsers = [spencerAdmin[0], jaysonAdmin[0]];
    
    for (const adminUser of adminUsers) {
      const platformConfigs = await db.insert(platforms).values([
        {
          name: "Instagram",
          icon: "SiInstagram",
          color: "#E4405F",
          isConnected: false,
          userId: adminUser.id
        },
        {
          name: "Facebook",
          icon: "SiFacebook",
          color: "#1877F2",
          isConnected: false,
          userId: adminUser.id
        },
        {
          name: "X",
          icon: "SiX",
          color: "#000000",
          isConnected: false,
          userId: adminUser.id
        },
        {
          name: "TikTok",
          icon: "SiTiktok",
          color: "#000000",
          isConnected: false,
          userId: adminUser.id
        },
        {
          name: "LinkedIn",
          icon: "SiLinkedin",
          color: "#0A66C2",
          isConnected: false,
          userId: adminUser.id
        }
      ]).returning();
      
      console.log(`Created ${platformConfigs.length} platform configurations for ${adminUser.email}`);
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seed().then(() => process.exit(0));