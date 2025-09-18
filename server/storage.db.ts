import { db } from "./db";
import {
  users, platforms, campaigns, posts, aiSuggestions, analytics,
  creditTransactions, subscriptionPlans, adminActions, notifications, contentLibrary, brandProfiles, contentFeedback, referrals,
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
  type BrandProfile, type InsertBrandProfile,
  type ContentFeedback, type InsertContentFeedback,
  type Referral, type InsertReferral
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, asc, isNull, ne, or } from "drizzle-orm";
import type { IStorage } from "./storage";
import * as crypto from "crypto";

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

  async getScheduledPosts(params: { from: Date; to: Date; userId: string }): Promise<Post[]> {
    return await db.select().from(posts)
      .where(and(
        eq(posts.userId, params.userId),
        gte(posts.scheduledFor, params.from),
        lte(posts.scheduledFor, params.to)
      ))
      .orderBy(asc(posts.scheduledFor));
  }

  async getPosts(params: { userId: string; status?: string }): Promise<Post[]> {
    const conditions = [eq(posts.userId, params.userId)];
    if (params.status) {
      conditions.push(eq(posts.status, params.status));
    }
    
    return await db.select().from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt));
  }

  async checkScheduleConflicts(params: { 
    userId: string; 
    platform: string; 
    scheduledAt: Date; 
    duration: number;
    excludeId?: string;
  }): Promise<Post[]> {
    const startTime = params.scheduledAt;
    const endTime = new Date(startTime.getTime() + (params.duration * 60 * 1000));
    
    const conditions = [
      eq(posts.userId, params.userId),
      gte(posts.scheduledFor, startTime),
      lte(posts.scheduledFor, endTime)
    ];
    
    if (params.excludeId) {
      conditions.push(ne(posts.id, params.excludeId));
    }
    
    return await db.select().from(posts)
      .where(and(...conditions));
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
  
  // Content Feedback
  async createContentFeedback(feedback: InsertContentFeedback): Promise<ContentFeedback> {
    const result = await db.insert(contentFeedback).values(feedback).returning();
    return result[0];
  }
  
  async getContentFeedbackByUserId(userId: string): Promise<ContentFeedback[]> {
    return await db.select().from(contentFeedback)
      .where(eq(contentFeedback.userId, userId))
      .orderBy(desc(contentFeedback.createdAt));
  }
  
  async getContentFeedbackByContent(contentId: string): Promise<ContentFeedback[]> {
    return await db.select().from(contentFeedback)
      .where(eq(contentFeedback.contentId, contentId));
  }
  
  // Advanced Admin Operations
  async deleteUser(id: string): Promise<boolean> {
    try {
      // Delete all user data in transaction
      await db.delete(posts).where(eq(posts.userId, id));
      await db.delete(platforms).where(eq(platforms.userId, id));
      await db.delete(campaigns).where(eq(campaigns.userId, id));
      await db.delete(notifications).where(eq(notifications.userId, id));
      await db.delete(contentLibrary).where(eq(contentLibrary.userId, id));
      await db.delete(brandProfiles).where(eq(brandProfiles.userId, id));
      await db.delete(creditTransactions).where(eq(creditTransactions.userId, id));
      
      // Delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async suspendUser(id: string, reason?: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ accountStatus: "suspended", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async setUserAdmin(id: string, isAdmin: boolean): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        isAdmin, 
        role: isAdmin ? "admin" : "user",
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async updateUserEmail(id: string, email: string): Promise<User | undefined> {
    // Check if email already exists
    const existing = await db.select().from(users)
      .where(and(eq(users.email, email), ne(users.id, id)));
    
    if (existing.length > 0) {
      throw new Error("Email already in use");
    }
    
    const result = await db.update(users)
      .set({ 
        email,
        emailVerified: false,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async resetUserCredits(id: string, amount: number): Promise<User | undefined> {
    // Get current user
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;
    
    const oldCredits = currentUser.credits || 0;
    
    // Update user credits
    const result = await db.update(users)
      .set({ credits: amount, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    // Log the transaction
    await db.insert(creditTransactions).values({
      userId: id,
      amount: amount - oldCredits,
      type: "admin_reset",
      description: `Admin reset credits to ${amount}`,
      stripePaymentIntentId: null,
    });
    
    return result[0];
  }
  
  async getUserCreditHistory(userId: string): Promise<CreditTransaction[]> {
    return await db.select().from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }
  
  async getAllTransactions(): Promise<CreditTransaction[]> {
    return await db.select().from(creditTransactions)
      .orderBy(desc(creditTransactions.createdAt));
  }
  
  async pauseUser(userId: string, reason: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        accountStatus: "frozen",
        pausedAt: new Date(),
        pausedReason: reason,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async unpauseUser(userId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        accountStatus: "active",
        pausedAt: null,
        pausedReason: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserActivity(userId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        lastActivityAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async sendMessageToUser(userId: string, title: string, message: string, requiresPopup: boolean = true): Promise<Notification> {
    const result = await db.insert(notifications)
      .values({
        userId,
        fromUserId: null, // Admin message
        type: "admin_message",
        title,
        message,
        actionUrl: null,
        read: false,
        requiresPopup,
        deliveredAt: null
      })
      .returning();
    return result[0];
  }

  async updateTrialPeriod(userId: string, endDate: Date): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        trialEndDate: endDate,
        trialEndsAt: endDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUnreadPopupMessages(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.requiresPopup, true),
        isNull(notifications.deliveredAt)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async markMessageDelivered(notificationId: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({
        deliveredAt: new Date(),
        read: true
      })
      .where(eq(notifications.id, notificationId))
      .returning();
    return result[0];
  }
  
  async getSystemStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    const activeUsers = allUsers.filter(u => u.accountStatus === "active");
    const suspendedUsers = allUsers.filter(u => u.accountStatus === "suspended");
    const deletedUsers = allUsers.filter(u => u.accountStatus === "deleted");
    
    const usersByTier = {
      free: allUsers.filter(u => u.tier === "free").length,
      starter: allUsers.filter(u => u.tier === "starter").length,
      professional: allUsers.filter(u => u.tier === "professional").length,
      business: allUsers.filter(u => u.tier === "business").length,
      enterprise: allUsers.filter(u => u.tier === "enterprise").length,
    };
    
    const totalCredits = allUsers.reduce((sum, u) => sum + (u.credits || 0), 0);
    const totalCreditsUsed = allUsers.reduce((sum, u) => sum + (u.totalCreditsUsed || 0), 0);
    
    const allPosts = await db.select({ count: sql<number>`count(*)::int` }).from(posts);
    const allCampaigns = await db.select({ count: sql<number>`count(*)::int` }).from(campaigns);
    const allTransactions = await db.select().from(creditTransactions);
    
    const totalRevenue = allTransactions
      .filter(t => t.type === "purchase" && t.amount > 0)
      .reduce((sum, t) => sum + (t.amount * 0.1), 0); // Assuming $0.10 per credit
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      suspendedUsers: suspendedUsers.length,
      deletedUsers: deletedUsers.length,
      usersByTier,
      totalCreditsInSystem: totalCredits,
      totalCreditsUsed,
      averageCreditsPerUser: allUsers.length > 0 ? Math.round(totalCredits / allUsers.length) : 0,
      totalPosts: allPosts[0]?.count || 0,
      totalCampaigns: allCampaigns[0]?.count || 0,
      totalRevenue,
      totalTransactions: allTransactions.length,
    };
  }

  // Referral system methods
  async generateReferralCode(userId: string): Promise<User | undefined> {
    // Generate unique 8-character referral code
    let referralCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const existing = await db.select().from(users).where(eq(users.referralCode, referralCode));
      isUnique = existing.length === 0;
    }
    
    const result = await db.update(users)
      .set({ 
        referralCode, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return result[0];
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const result = await db.insert(referrals).values(referral).returning();
    return result[0];
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return await db.select().from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return await db.select().from(referrals)
      .where(eq(referrals.referredUserId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async completeReferral(referralId: string, creditsEarned: number): Promise<Referral | undefined> {
    const result = await db.update(referrals)
      .set({
        status: "completed",
        creditsEarned,
        completedAt: new Date(),
      })
      .where(eq(referrals.id, referralId))
      .returning();
    return result[0];
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    creditsEarned: number;
    pendingReferrals: number;
  }> {
    const allReferrals = await this.getReferralsByReferrer(userId);
    const completed = allReferrals.filter(r => r.status === "completed");
    const pending = allReferrals.filter(r => r.status === "pending");
    const creditsEarned = completed.reduce((sum, r) => sum + (r.creditsEarned || 0), 0);

    return {
      totalReferrals: allReferrals.length,
      completedReferrals: completed.length,
      creditsEarned,
      pendingReferrals: pending.length,
    };
  }

  // Enhanced Admin Methods Implementation
  async getUserLastActivity(userId: string): Promise<Date | null> {
    const user = await this.getUser(userId);
    return user?.lastActivityAt || user?.lastLoginAt || null;
  }

  async getUserLoginHistory(userId: string, limit: number): Promise<Array<{ timestamp: Date; ip?: string; userAgent?: string }>> {
    // This would require a separate login_history table in production
    // For now, return empty array as placeholder
    return [];
  }

  async getUserMessages(userId: string, unreadOnly: boolean): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    return await db.select().from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async createUrgentMessage(data: {
    userId: string;
    title: string;
    message: string;
    priority: string;
    requiresPopup?: boolean;
    requiresAcknowledgment?: boolean;
    expiresAt?: Date;
    adminId?: string;
  }): Promise<Notification> {
    const result = await db.insert(notifications)
      .values({
        userId: data.userId,
        fromUserId: data.adminId || null,
        type: "urgent_message",
        title: data.title,
        message: data.message,
        actionUrl: null,
        read: false,
        requiresPopup: data.requiresPopup || false,
        deliveredAt: null
      })
      .returning();
    return result[0];
  }

  async createImpersonationSession(data: {
    adminId: string;
    userId: string;
    reason: string;
    expiresAt: Date;
  }): Promise<{ id: string; token: string; }> {
    // This would require a separate impersonation_sessions table
    // For now, return mock data
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();

    // Log the impersonation attempt
    await this.logAdminAction({
      adminUserId: data.adminId,
      targetUserId: data.userId,
      action: "impersonate_user",
      details: { reason: data.reason, expiresAt: data.expiresAt }
    });

    return { id, token };
  }

  async getOnlineUserCount(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(or(
        gte(users.lastActivityAt, fiveMinutesAgo),
        gte(users.lastLoginAt, fiveMinutesAgo)
      ));
    return result[0]?.count || 0;
  }

  async getSignupsCount(hours: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, cutoffTime));
    return result[0]?.count || 0;
  }

  async getActiveTrialsCount(): Promise<number> {
    const now = new Date();
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(
        eq(users.tier, 'free'),
        eq(users.isPaid, false),
        or(
          gte(users.trialEndDate, now),
          gte(users.trialEndsAt, now)
        )
      ));
    return result[0]?.count || 0;
  }

  async getExpiredTrialsCount(): Promise<number> {
    const now = new Date();
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(
        eq(users.tier, 'free'),
        eq(users.isPaid, false),
        or(
          and(
            lte(users.trialEndDate, now),
            ne(users.trialEndDate, null)
          ),
          and(
            lte(users.trialEndsAt, now),
            ne(users.trialEndsAt, null)
          )
        )
      ));
    return result[0]?.count || 0;
  }

  async getTotalRevenue(): Promise<number> {
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(amount * 0.1), 0)::float`
    })
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.type, "purchase"),
        gte(creditTransactions.amount, 0)
      ));
    return result[0]?.total || 0;
  }

  async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(amount * 0.1), 0)::float`
    })
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.type, "purchase"),
        gte(creditTransactions.amount, 0),
        gte(creditTransactions.createdAt, firstOfMonth)
      ));
    return result[0]?.total || 0;
  }

  async getAverageRevenuePerUser(): Promise<number> {
    const totalRevenue = await this.getTotalRevenue();
    const paidUsersResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isPaid, true));
    const paidUsers = paidUsersResult[0]?.count || 0;
    return paidUsers > 0 ? totalRevenue / paidUsers : 0;
  }

  async getChurnRate(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const totalPaidResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isPaid, true));
    const totalPaidUsers = totalPaidResult[0]?.count || 0;

    const churnedResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(
        eq(users.subscriptionStatus, "cancelled"),
        gte(users.updatedAt, thirtyDaysAgo)
      ));
    const churned = churnedResult[0]?.count || 0;

    return totalPaidUsers > 0 ? (churned / totalPaidUsers) * 100 : 0;
  }

  async getSystemAlerts(): Promise<Array<{ id: string; type: string; message: string; severity: string; timestamp: Date }>> {
    const alerts = [];

    const expiredTrials = await this.getExpiredTrialsCount();
    if (expiredTrials > 10) {
      alerts.push({
        id: "expired-trials-high",
        type: "user_management",
        message: `${expiredTrials} users have expired trials`,
        severity: "warning",
        timestamp: new Date()
      });
    }

    const lowCreditUsersResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(
        lte(users.credits, 10),
        eq(users.isPaid, false)
      ));
    const lowCreditUsers = lowCreditUsersResult[0]?.count || 0;

    if (lowCreditUsers > 5) {
      alerts.push({
        id: "low-credit-users",
        type: "billing",
        message: `${lowCreditUsers} users have less than 10 credits`,
        severity: "info",
        timestamp: new Date()
      });
    }

    return alerts;
  }

  async getSubscriptionHistory(userId: string): Promise<Array<{ date: Date; tier: string; action: string }>> {
    // This would require a separate subscription_history table
    // For now, return empty array
    return [];
  }

  async getStripeInvoices(customerId: string): Promise<Array<any>> {
    // Would integrate with Stripe API
    return [];
  }

  async getPaymentMethods(customerId: string): Promise<Array<any>> {
    // Would integrate with Stripe API
    return [];
  }

  async getUserUsageStats(userId: string): Promise<{
    postsGenerated: number;
    creditsUsed: number;
    campaignsCreated: number;
    platformsConnected: number;
    avgEngagement: number;
  }> {
    const [postsResult, campaignsResult, platformsResult, userResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(campaigns).where(eq(campaigns.userId, userId)),
      db.select({ count: sql<number>`count(*)::int` }).from(platforms).where(eq(platforms.userId, userId)),
      this.getUser(userId)
    ]);

    return {
      postsGenerated: postsResult[0]?.count || 0,
      creditsUsed: userResult?.totalCreditsUsed || 0,
      campaignsCreated: campaignsResult[0]?.count || 0,
      platformsConnected: platformsResult[0]?.count || 0,
      avgEngagement: 0 // Would calculate from analytics data
    };
  }
}