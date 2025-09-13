import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, jsonb, integer, real, date, index, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Authentication fields
  email: text("email").unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  fullName: text("full_name"),
  profileImageUrl: text("profile_image_url"),
  
  // Business info
  businessName: text("business_name"),
  avatar: text("avatar"),
  googleAvatar: text("google_avatar"),
  
  // Roles and status
  role: text("role").notNull().default("user"), // admin, user
  isAdmin: boolean("is_admin").notNull().default(false),
  accountStatus: text("account_status").notNull().default("active"), // active, frozen, deleted
  
  // Subscription and billing
  tier: text("tier").notNull().default("free"), // free, starter, professional, enterprise, pay_as_you_go
  subscriptionStatus: text("subscription_status").notNull().default("trial"), // trial, active, cancelled, expired
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  
  // Credits system
  credits: integer("credits").notNull().default(50),
  freeCreditsUsed: boolean("free_credits_used").notNull().default(false),
  totalCreditsUsed: integer("total_credits_used").notNull().default(0),
  
  // Email verification
  emailVerified: boolean("email_verified").default(false),
  emailVerificationCode: text("email_verification_code"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  emailVerificationAttempts: integer("email_verification_attempts").default(0),
  
  // Trial system
  cardOnFile: boolean("card_on_file").default(false),
  trialVariant: text("trial_variant", { enum: ['nocard7', 'card14'] }).default('nocard7'),
  trialStartedAt: timestamp("trial_started_at").defaultNow(),
  trialEndsAt: timestamp("trial_ends_at").default(sql`now() + interval '7 days'`),
  trialImagesRemaining: integer("trial_images_remaining").default(6),
  trialVideosRemaining: integer("trial_videos_remaining").default(0),
  
  // Trial tracking
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  trialEndDate: timestamp("trial_end_date").default(sql`NOW() + INTERVAL '7 days'`),
  isPaid: boolean("is_paid").notNull().default(false),
  needsTrialSelection: boolean("needs_trial_selection").notNull().default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  deletedAt: timestamp("deleted_at"),
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
  createdAt: timestamp("created_at").defaultNow(),
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
  platforms: json("platforms").$type<string[]>().notNull().default([]),
  visualStyle: text("visual_style").notNull(),
  colorScheme: text("color_scheme"),
  callToAction: text("call_to_action").notNull(),
  status: text("status").notNull().default("draft"), // draft, generating, review, active, completed, paused
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  postsPerDay: integer("posts_per_day").notNull().default(2),
  totalPosts: integer("total_posts").notNull().default(14),
  generationProgress: integer("generation_progress").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  contentRef: varchar("content_ref").references(() => contentLibrary.id), // Reference to content library
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  imagePrompt: text("image_prompt"),
  videoPrompt: text("video_prompt"),
  platforms: json("platforms").$type<string[]>().notNull(),
  status: text("status").notNull(), // draft, pending_approval, approved, rejected, scheduled, posted, failed
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
  metadata: json("metadata").$type<{
    day?: number;
    slot?: number;
    campaignPost?: boolean;
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  fullName: true,
  businessName: true,
  avatar: true,
  googleAvatar: true,
  role: true,
  tier: true,
  credits: true,
  emailVerified: true,
  trialVariant: true,
  trialStartedAt: true,
  trialEndsAt: true,
  trialImagesRemaining: true,
  trialVideosRemaining: true,
  isNewUser: true,
  needsTrialSelection: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
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

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  publishedAt: true,
  approvedBy: true,
  rejectionReason: true,
  engagementData: true,
  createdAt: true,
  updatedAt: true,
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

// Credit transactions table
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  amount: integer("amount").notNull(), // Positive for additions, negative for usage
  type: text("type").notNull(), // purchase, usage, refund, admin_adjustment, bonus
  description: text("description"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by"), // Admin user ID if admin adjustment
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tier: text("tier").notNull(), // starter, professional, enterprise
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  creditsPerMonth: integer("credits_per_month").notNull(),
  features: jsonb("features").notNull().default([]), // Array of feature strings
  stripePriceId: text("stripe_price_id"),
  maxCampaigns: integer("max_campaigns").default(0),
  hasVideoGeneration: boolean("has_video_generation").default(false),
  hasAiAssistant: boolean("has_ai_assistant").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin actions log
export const adminActions = pgTable("admin_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").references(() => users.id),
  targetUserId: varchar("target_user_id").references(() => users.id),
  action: text("action").notNull(), // add_credits, remove_credits, freeze_account, delete_account, change_tier, process_refund
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // null for global notifications
  fromUserId: varchar("from_user_id").references(() => users.id), // who sent the notification (admin usually)
  type: text("type").notNull(), // system, admin_message, campaign_complete, post_approved, post_rejected, credit_low, new_feature
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"), // Optional URL to navigate to
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content library table for storing all generated and uploaded media
export const contentLibrary = pgTable("content_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // image, video
  url: text("url").notNull(),
  thumbnail: text("thumbnail"), // For video thumbnails
  caption: text("caption"),
  metadata: jsonb("metadata"), // Store generation settings, dimensions, etc.
  tags: text("tags").array(), // For searching
  businessName: text("business_name"),
  productName: text("product_name"),
  platform: text("platform"), // Instagram, Facebook, etc.
  usageCount: integer("usage_count").default(0), // How many times used in posts
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brand Profile for quality content generation
export const brandProfiles = pgTable("brand_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  brandName: text("brand_name").notNull(),
  voice: text("voice"), // friendly, bold, professional, playful
  targetAudience: text("target_audience"),
  products: json("products").$type<string[]>().default([]),
  valueProps: json("value_props").$type<string[]>().default([]),
  bannedPhrases: json("banned_phrases").$type<string[]>().default([]),
  requiredDisclaimers: json("required_disclaimers").$type<string[]>().default([]),
  preferredCTAs: json("preferred_ctas").$type<string[]>().default([]),
  keywords: json("keywords").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Feedback for improving quality
export const contentFeedback = pgTable("content_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentId: varchar("content_id"), // Post or AI suggestion ID
  contentType: text("content_type"), // post, ai_suggestion, campaign_post
  feedback: text("feedback").notNull(), // thumbs_up, thumbs_down
  reasons: json("reasons").$type<string[]>().default([]), // too_generic, too_long, off_brand, etc
  qualityScore: real("quality_score"), // Score at time of generation
  platform: text("platform"),
  postType: text("post_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  fromUserId: true,
  type: true,
  title: true,
  message: true,
  actionUrl: true,
  read: true,
});

export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandProfileSchema = createInsertSchema(brandProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentFeedbackSchema = createInsertSchema(contentFeedback).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type UserRole = "admin" | "user";
export type UserTier = "free" | "starter" | "professional" | "enterprise" | "pay_as_you_go";
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
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = typeof adminActions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ContentLibraryItem = typeof contentLibrary.$inferSelect;
export type InsertContentLibrary = z.infer<typeof insertContentLibrarySchema>;
export type BrandProfile = typeof brandProfiles.$inferSelect;
export type InsertBrandProfile = z.infer<typeof insertBrandProfileSchema>;
export type ContentFeedback = typeof contentFeedback.$inferSelect;
export type InsertContentFeedback = z.infer<typeof insertContentFeedbackSchema>;