import { db } from "./db";
import { 
  users, platforms, campaigns, posts, aiSuggestions, analytics,
  creditTransactions, subscriptionPlans, adminActions, notifications, contentLibrary, brandProfiles,
  type User, type InsertUser, type UpsertUser,
  type Platform, type InsertPlatform,
  type Campaign, type InsertCampaign,
  type Post, type InsertPost,
  type AiSuggestion, type InsertAiSuggestion,
  type Analytics, type InsertAnalytics,
  type CreditTransaction, type InsertCreditTransaction,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type AdminAction, type InsertAdminAction,
  type Notification, type InsertNotification,
  type ContentLibraryItem, type InsertContentLibrary,
  type BrandProfile, type InsertBrandProfile
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, asc, isNull, ne } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const result = await db.insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.username,
        set: user
      })
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Platforms
  async getPlatformsByUserId(userId: string): Promise<Platform[]> {
    return await db.select().from(platforms).where(eq(platforms.userId, userId));
  }

  async getPlatformById(id: string): Promise<Platform | undefined> {
    const result = await db.select().from(platforms).where(eq(platforms.id, id));
    return result[0];
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const result = await db.insert(platforms).values(platform).returning();
    return result[0];
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined> {
    const result = await db.update(platforms).set(updates).where(eq(platforms.id, id)).returning();
    return result[0];
  }

  // Campaigns
  async getCampaignsByUserId(userId: string): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaignsByStatus(userId: string, status: string): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .where(and(eq(campaigns.userId, userId), eq(campaigns.status, status)))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return result[0];
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const result = await db.insert(campaigns).values(campaign).returning();
    return result[0];
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const result = await db.update(campaigns).set(updates).where(eq(campaigns.id, id)).returning();
    return result[0];
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
    return result.length > 0;
  }
  
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return this.getCampaignsByUserId(userId);
  }
  
  async getScheduledPostAtTime(userId: string, scheduledTime: Date): Promise<Post | undefined> {
    const oneMinuteBefore = new Date(scheduledTime.getTime() - 60000);
    const oneMinuteAfter = new Date(scheduledTime.getTime() + 60000);
    
    const result = await db.select().from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          gte(posts.scheduledFor, oneMinuteBefore),
          lte(posts.scheduledFor, oneMinuteAfter)
        )
      );
    return result[0];
  }

  // Posts
  async getPostsByUserId(userId: string): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getPostsByStatus(userId: string, status: string): Promise<Post[]> {
    return await db.select().from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, status)))
      .orderBy(desc(posts.createdAt));
  }

  async getPostsByCampaignId(campaignId: string): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.campaignId, campaignId))
      .orderBy(asc(posts.scheduledFor));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id));
    return result[0];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const result = await db.update(posts).set(updates).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }

  // AI Suggestions
  async getAiSuggestionsByUserId(userId: string): Promise<AiSuggestion[]> {
    return await db.select().from(aiSuggestions)
      .where(eq(aiSuggestions.userId, userId))
      .orderBy(desc(aiSuggestions.createdAt));
  }

  async createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const result = await db.insert(aiSuggestions).values(suggestion).returning();
    return result[0];
  }

  // Analytics
  async getAnalyticsByUserId(userId: string): Promise<Analytics[]> {
    return await db.select().from(analytics)
      .where(eq(analytics.userId, userId))
      .orderBy(desc(analytics.date));
  }

  async getAnalyticsByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Analytics[]> {
    return await db.select().from(analytics)
      .where(and(
        eq(analytics.userId, userId),
        gte(analytics.date, startDate),
        lte(analytics.date, endDate)
      ))
      .orderBy(desc(analytics.date));
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const result = await db.insert(analytics).values(analyticsData).returning();
    return result[0];
  }

  // Credit Transactions
  async getCreditTransactionsByUserId(userId: string): Promise<CreditTransaction[]> {
    return await db.select().from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const result = await db.insert(creditTransactions).values(transaction).returning();
    
    // Update user credits
    if (transaction.userId) {
      await db.update(users)
        .set({
          credits: sql`${users.credits} + ${transaction.amount}`,
          totalCreditsUsed: transaction.amount < 0 
            ? sql`${users.totalCreditsUsed} + ${Math.abs(transaction.amount)}`
            : users.totalCreditsUsed
        })
        .where(eq(users.id, transaction.userId));
    }
    
    return result[0];
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async getSubscriptionPlanByTier(tier: string): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.tier, tier));
    return result[0];
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const result = await db.insert(subscriptionPlans).values(plan).returning();
    return result[0];
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const result = await db.update(subscriptionPlans).set(updates).where(eq(subscriptionPlans.id, id)).returning();
    return result[0];
  }

  // Admin Actions
  async logAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    const result = await db.insert(adminActions).values(action).returning();
    return result[0];
  }

  async getAdminActionsByTargetUser(userId: string): Promise<AdminAction[]> {
    return await db.select().from(adminActions)
      .where(eq(adminActions.targetUserId, userId))
      .orderBy(desc(adminActions.createdAt));
  }

  // Notifications
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result[0]?.count || 0);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  async createGlobalNotification(notification: Omit<InsertNotification, 'userId'>): Promise<void> {
    const allUsers = await db.select({ id: users.id }).from(users);
    const notificationsToInsert = allUsers.map(user => ({
      ...notification,
      userId: user.id
    }));
    
    if (notificationsToInsert.length > 0) {
      await db.insert(notifications).values(notificationsToInsert);
    }
  }

  // Content Library
  async getContentLibraryByUserId(userId: string): Promise<ContentLibraryItem[]> {
    return await db.select().from(contentLibrary)
      .where(eq(contentLibrary.userId, userId))
      .orderBy(desc(contentLibrary.createdAt));
  }

  async searchContentLibrary(userId: string, query: string): Promise<ContentLibraryItem[]> {
    const lowerQuery = query.toLowerCase();
    return await db.select().from(contentLibrary)
      .where(and(
        eq(contentLibrary.userId, userId),
        sql`LOWER(CONCAT(
          COALESCE(${contentLibrary.caption}, ''), ' ',
          COALESCE(${contentLibrary.businessName}, ''), ' ', 
          COALESCE(${contentLibrary.productName}, ''), ' ',
          COALESCE(${contentLibrary.platform}, '')
        )) LIKE ${`%${lowerQuery}%`}`
      ))
      .orderBy(desc(contentLibrary.createdAt));
  }

  async createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibraryItem> {
    const result = await db.insert(contentLibrary).values(item).returning();
    return result[0];
  }

  async updateContentLibraryItem(id: string, userId: string, updates: Partial<ContentLibraryItem>): Promise<ContentLibraryItem | undefined> {
    const result = await db.update(contentLibrary)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(contentLibrary.id, id), eq(contentLibrary.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteContentLibraryItem(id: string, userId?: string): Promise<boolean> {
    const condition = userId 
      ? and(eq(contentLibrary.id, id), eq(contentLibrary.userId, userId))
      : eq(contentLibrary.id, id);
    
    const result = await db.delete(contentLibrary).where(condition).returning();
    return result.length > 0;
  }

  async incrementUsageCount(id: string): Promise<void> {
    await db.update(contentLibrary)
      .set({
        usageCount: sql`${contentLibrary.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(contentLibrary.id, id));
  }
  
  // Brand Profile
  async getBrandProfile(userId: string): Promise<BrandProfile | undefined> {
    const result = await db.select().from(brandProfiles)
      .where(eq(brandProfiles.userId, userId));
    return result[0];
  }

  async createBrandProfile(profile: InsertBrandProfile): Promise<BrandProfile> {
    const result = await db.insert(brandProfiles).values(profile).returning();
    return result[0];
  }

  async updateBrandProfile(userId: string, updates: Partial<BrandProfile>): Promise<BrandProfile | undefined> {
    const result = await db.update(brandProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandProfiles.userId, userId))
      .returning();
    return result[0];
  }
}