import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, jsonb, integer, real, date, decimal, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for OAuth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with OAuth and credit system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  businessName: text("business_name"),
  // Credit system fields
  credits: integer("credits").notNull().default(50), // Start with 50 free credits
  subscriptionId: varchar("subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, trial, active, cancelled, expired
  subscriptionEndDate: timestamp("subscription_end_date"),
  totalCreditsUsed: integer("total_credits_used").notNull().default(0),
  // Stripe fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  trialEndsAt: timestamp("trial_ends_at"),
  // Admin fields
  isAdmin: boolean("is_admin").notNull().default(false),
  adminPassword: varchar("admin_password"), // For admin-only login
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const platforms = pgTable("platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  isConnected: boolean("is_connected").default(false),
  userId: varchar("user_id").references(() => users.id),
  accountId: text("account_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  scope: text("scope"), // OAuth permissions granted
  platformUserId: text("platform_user_id"), // User ID on the platform
  platformUsername: text("platform_username"), // Username on the platform
  connectionStatus: text("connection_status").default("active"), // active, expired, revoked, error
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull(),
  businessName: text("business_name").notNull(),
  productName: text("product_name"),
  targetAudience: text("target_audience").notNull(),
  campaignGoals: text("campaign_goals").notNull(),
  brandTone: text("brand_tone").notNull(),
  keyMessages: json("key_messages").$type<string[]>().default([]),
  visualStyle: text("visual_style").notNull(),
  colorScheme: text("color_scheme"),
  callToAction: text("call_to_action").notNull(),
  status: text("status").notNull().default("draft"), // draft, generating, review, active, completed, paused
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  postsPerDay: integer("posts_per_day").notNull().default(2),
  generationProgress: integer("generation_progress").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  imagePrompt: text("image_prompt"),
  videoPrompt: text("video_prompt"),
  platforms: json("platforms").$type<string[]>().notNull(),
  status: text("status").notNull(), // draft, pending, approved, rejected, published, scheduled
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  mediaUrls: json("media_urls").$type<string[]>().default([]),
  aiGenerated: boolean("ai_generated").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  engagementData: json("engagement_data").$type<{
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    reach: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiSuggestions = pgTable("ai_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  prompt: text("prompt").notNull(),
  suggestions: json("suggestions").$type<string[]>().notNull(),
  selected: boolean("selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platform: text("platform").notNull(),
  metric: text("metric").notNull(), // engagement, reach, followers, clicks
  value: integer("value").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }).notNull(),
  creditsPerMonth: integer("credits_per_month").notNull(),
  features: json("features").$type<string[]>().notNull(),
  maxPlatforms: integer("max_platforms").notNull(),
  analyticsAccess: boolean("analytics_access").notNull().default(false),
  aiSuggestions: boolean("ai_suggestions").notNull().default(false),
  prioritySupport: boolean("priority_support").notNull().default(false),
  teamMembers: integer("team_members").notNull().default(1),
  videoGeneration: boolean("video_generation").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: varchar("status").notNull(), // active, cancelled, expired, trial
  billingCycle: varchar("billing_cycle").notNull(), // monthly, yearly
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  nextBillingDate: timestamp("next_billing_date"),
  autoRenew: boolean("auto_renew").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit Transactions
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // positive for credits added, negative for credits used
  balance: integer("balance").notNull(), // balance after transaction
  type: varchar("type").notNull(), // purchase, subscription, usage, refund, bonus
  description: text("description").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage Tracking
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  featureType: varchar("feature_type").notNull(), // text_generation, image_generation, video_generation, post_scheduling
  creditsUsed: integer("credits_used").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  postId: varchar("post_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  businessName: true,
  credits: true,
  subscriptionId: true,
  subscriptionStatus: true,
  subscriptionEndDate: true,
});

export const insertPlatformSchema = createInsertSchema(platforms).pick({
  name: true,
  icon: true,
  color: true,
  isConnected: true,
  userId: true,
  accountId: true,
  accessToken: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  userId: true,
  name: true,
  description: true,
  platform: true,
  businessName: true,
  productName: true,
  targetAudience: true,
  campaignGoals: true,
  brandTone: true,
  keyMessages: true,
  visualStyle: true,
  colorScheme: true,
  callToAction: true,
  status: true,
  startDate: true,
  endDate: true,
  postsPerDay: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  campaignId: true,
  content: true,
  imageUrl: true,
  videoUrl: true,
  imagePrompt: true,
  videoPrompt: true,
  platforms: true,
  status: true,
  scheduledFor: true,
  mediaUrls: true,
  aiGenerated: true,
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).pick({
  userId: true,
  prompt: true,
  suggestions: true,
  selected: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  userId: true,
  platform: true,
  metric: true,
  value: true,
  date: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  id: true,
  name: true,
  displayName: true,
  monthlyPrice: true,
  yearlyPrice: true,
  creditsPerMonth: true,
  features: true,
  maxPlatforms: true,
  analyticsAccess: true,
  aiSuggestions: true,
  prioritySupport: true,
  teamMembers: true,
  videoGeneration: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  planId: true,
  status: true,
  billingCycle: true,
  startDate: true,
  endDate: true,
  cancelledAt: true,
  nextBillingDate: true,
  autoRenew: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).pick({
  userId: true,
  amount: true,
  balance: true,
  type: true,
  description: true,
  metadata: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).pick({
  userId: true,
  featureType: true,
  creditsUsed: true,
  metadata: true,
  postId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  platforms: many(platforms),
  campaigns: many(campaigns),
  subscriptions: many(userSubscriptions),
  creditTransactions: many(creditTransactions),
  usageTracking: many(usageTracking),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));