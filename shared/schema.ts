import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  businessName: text("business_name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  businessName: true,
  avatar: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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