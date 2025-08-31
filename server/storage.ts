import { 
  type User, type InsertUser, type UpsertUser,
  type Platform, type InsertPlatform, 
  type Post, type InsertPost, 
  type AiSuggestion, type InsertAiSuggestion, 
  type Analytics, type InsertAnalytics, 
  type Campaign, type InsertCampaign,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type UserSubscription, type InsertUserSubscription,
  type CreditTransaction, type InsertCreditTransaction,
  type UsageTracking, type InsertUsageTracking
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserCredits(userId: string, creditChange: number, description: string, type: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  
  // Platforms
  getPlatformsByUserId(userId: string): Promise<Platform[]>;
  getUserPlatforms(userId: string): Promise<Platform[]>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined>;
  connectPlatform(userId: string, connectionData: {
    platformId: string;
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
    platformUserId?: string;
    platformUsername?: string;
  }): Promise<Platform>;
  disconnectPlatform(userId: string, platformId: string): Promise<boolean>;
  
  // Campaigns
  getCampaignsByUserId(userId: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;
  
  // Posts
  getPostsByUserId(userId: string): Promise<Post[]>;
  getPostsByStatus(userId: string, status: string): Promise<Post[]>;
  getPostsByCampaignId(campaignId: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  
  // AI Suggestions
  getAiSuggestionsByUserId(userId: string): Promise<AiSuggestion[]>;
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  
  // Analytics
  getAnalyticsByUserId(userId: string): Promise<Analytics[]>;
  getAnalyticsByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  
  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  
  // User Subscriptions
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  
  // Credit Transactions
  getCreditTransactionsByUserId(userId: string): Promise<CreditTransaction[]>;
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  
  // Usage Tracking
  getUsageByUserId(userId: string): Promise<UsageTracking[]>;
  createUsageTracking(usage: InsertUsageTracking): Promise<UsageTracking>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private platforms: Map<string, Platform>;
  private campaigns: Map<string, Campaign>;
  private posts: Map<string, Post>;
  private aiSuggestions: Map<string, AiSuggestion>;
  private analytics: Map<string, Analytics>;
  private subscriptionPlans: Map<string, SubscriptionPlan>;
  private userSubscriptions: Map<string, UserSubscription>;
  private creditTransactions: Map<string, CreditTransaction>;
  private usageTracking: Map<string, UsageTracking>;

  constructor() {
    this.users = new Map();
    this.platforms = new Map();
    this.campaigns = new Map();
    this.posts = new Map();
    this.aiSuggestions = new Map();
    this.analytics = new Map();
    this.subscriptionPlans = new Map();
    this.userSubscriptions = new Map();
    this.creditTransactions = new Map();
    this.usageTracking = new Map();
    
    // Only initialize subscription plans, no demo data
    this.initializeSubscriptionPlans();
  }

  // Demo data initialization removed - users start with clean slate
  // When users sign up, they get an empty platform without fake posts or analytics
  private initializeDemoData() {
    // Method removed - no more fake data for new users
  }

  private initializeSubscriptionPlans() {
    const plans: SubscriptionPlan[] = [
      {
        id: "free",
        name: "free",
        displayName: "Free Trial",
        monthlyPrice: "0.00",
        yearlyPrice: "0.00",
        creditsPerMonth: 50,
        features: [
          "50 credits per month",
          "Basic AI content generation",
          "2 social media platforms",
          "Basic analytics"
        ],
        maxPlatforms: 2,
        analyticsAccess: true,
        aiSuggestions: true,
        prioritySupport: false,
        teamMembers: 1,
        videoGeneration: false,
        createdAt: new Date(),
      },
      {
        id: "starter",
        name: "starter",
        displayName: "Starter",
        monthlyPrice: "29.00",
        yearlyPrice: "290.00",
        creditsPerMonth: 500,
        features: [
          "500 credits per month",
          "Advanced AI content generation",
          "5 social media platforms",
          "Detailed analytics",
          "Image generation (10 per month)",
          "Priority email support"
        ],
        maxPlatforms: 5,
        analyticsAccess: true,
        aiSuggestions: true,
        prioritySupport: true,
        teamMembers: 1,
        videoGeneration: false,
        createdAt: new Date(),
      },
      {
        id: "professional",
        name: "professional",
        displayName: "Professional",
        monthlyPrice: "99.00",
        yearlyPrice: "990.00",
        creditsPerMonth: 2000,
        features: [
          "2,000 credits per month",
          "Premium AI content generation",
          "Unlimited social media platforms",
          "Advanced analytics & reporting",
          "Image generation (50 per month)",
          "Video generation (5 per month)",
          "Priority phone & email support",
          "3 team members"
        ],
        maxPlatforms: 999,
        analyticsAccess: true,
        aiSuggestions: true,
        prioritySupport: true,
        teamMembers: 3,
        videoGeneration: true,
        createdAt: new Date(),
      },
      {
        id: "enterprise",
        name: "enterprise",
        displayName: "Enterprise",
        monthlyPrice: "299.00",
        yearlyPrice: "2990.00",
        creditsPerMonth: 10000,
        features: [
          "10,000 credits per month",
          "Enterprise AI features",
          "Unlimited everything",
          "Custom analytics dashboards",
          "Unlimited image generation",
          "Video generation (50 per month)",
          "Dedicated account manager",
          "24/7 priority support",
          "Unlimited team members",
          "API access",
          "Custom integrations"
        ],
        maxPlatforms: 999,
        analyticsAccess: true,
        aiSuggestions: true,
        prioritySupport: true,
        teamMembers: 999,
        videoGeneration: true,
        createdAt: new Date(),
      },
    ];

    plans.forEach(plan => this.subscriptionPlans.set(plan.id, plan));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      businessName: insertUser.businessName ?? null,
      credits: insertUser.credits ?? 50,
      subscriptionId: insertUser.subscriptionId ?? "free",
      subscriptionStatus: insertUser.subscriptionStatus ?? "free",
      subscriptionEndDate: insertUser.subscriptionEndDate ?? null,
      totalCreditsUsed: 0,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      trialEndsAt: null,
      isAdmin: false,
      adminPassword: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    // Check if user exists
    const existingUser = upsertUser.id ? await this.getUser(upsertUser.id) : null;
    
    if (existingUser) {
      // Update existing user
      const updatedUser = {
        ...existingUser,
        ...upsertUser,
        updatedAt: new Date(),
      };
      this.users.set(existingUser.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const id = upsertUser.id || randomUUID();
      const newUser: User = {
        id,
        email: upsertUser.email ?? null,
        firstName: upsertUser.firstName ?? null,
        lastName: upsertUser.lastName ?? null,
        profileImageUrl: upsertUser.profileImageUrl ?? null,
        businessName: upsertUser.businessName ?? null,
        credits: upsertUser.credits ?? 50,
        subscriptionId: upsertUser.subscriptionId ?? "free",
        subscriptionStatus: upsertUser.subscriptionStatus ?? "free",
        subscriptionEndDate: upsertUser.subscriptionEndDate ?? null,
        totalCreditsUsed: upsertUser.totalCreditsUsed ?? 0,
        stripeCustomerId: upsertUser.stripeCustomerId ?? null,
        stripeSubscriptionId: upsertUser.stripeSubscriptionId ?? null,
        trialEndsAt: upsertUser.trialEndsAt ?? null,
        isAdmin: upsertUser.isAdmin ?? false,
        adminPassword: upsertUser.adminPassword ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(id, newUser);
      return newUser;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserCredits(userId: string, creditChange: number, description: string, type: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const newCredits = user.credits + creditChange;
    const updatedUser = {
      ...user,
      credits: newCredits,
      totalCreditsUsed: creditChange < 0 ? user.totalCreditsUsed + Math.abs(creditChange) : user.totalCreditsUsed,
      updatedAt: new Date(),
    };
    this.users.set(userId, updatedUser);

    // Create credit transaction
    await this.createCreditTransaction({
      userId,
      amount: creditChange,
      balance: newCredits,
      type,
      description,
      metadata: null,
    });

    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Platforms
  async getPlatformsByUserId(userId: string): Promise<Platform[]> {
    return Array.from(this.platforms.values()).filter(platform => platform.userId === userId);
  }

  async createPlatform(insertPlatform: InsertPlatform): Promise<Platform> {
    const id = randomUUID();
    const platform: Platform = {
      ...insertPlatform,
      id,
      isConnected: insertPlatform.isConnected ?? null,
      userId: insertPlatform.userId ?? null,
      accountId: insertPlatform.accountId ?? null,
      accessToken: insertPlatform.accessToken ?? null,
      refreshToken: null,
      tokenExpiry: null,
      scope: null,
      platformUserId: null,
      platformUsername: null,
      connectionStatus: null,
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.platforms.set(id, platform);
    return platform;
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined> {
    const platform = this.platforms.get(id);
    if (!platform) return undefined;
    
    const updatedPlatform = { ...platform, ...updates };
    this.platforms.set(id, updatedPlatform);
    return updatedPlatform;
  }

  async getUserPlatforms(userId: string): Promise<Platform[]> {
    return Array.from(this.platforms.values()).filter(platform => platform.userId === userId);
  }

  async connectPlatform(userId: string, connectionData: {
    platformId: string;
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
    platformUserId?: string;
    platformUsername?: string;
  }): Promise<Platform> {
    const { platformId, accessToken, refreshToken, scope, platformUserId, platformUsername } = connectionData;
    
    // Find existing platform connection for this user and platform
    const existingPlatform = Array.from(this.platforms.values())
      .find(p => p.userId === userId && p.name === platformId);
    
    if (existingPlatform) {
      // Update existing connection
      const updatedPlatform = {
        ...existingPlatform,
        isConnected: true,
        accessToken: accessToken || existingPlatform.accessToken,
        refreshToken: refreshToken || null,
        scope: scope || null,
        platformUserId: platformUserId || null,
        platformUsername: platformUsername || null,
        tokenExpiry: null,
        connectionStatus: "active",
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      };
      this.platforms.set(existingPlatform.id, updatedPlatform);
      return updatedPlatform;
    } else {
      // Create new platform connection
      const platformMap: { [key: string]: { name: string; icon: string; color: string } } = {
        instagram: { name: "Instagram", icon: "fab fa-instagram", color: "#E1306C" },
        facebook: { name: "Facebook", icon: "fab fa-facebook", color: "#1877F2" },
        twitter: { name: "X (Twitter)", icon: "fab fa-twitter", color: "#1DA1F2" },
        linkedin: { name: "LinkedIn", icon: "fab fa-linkedin", color: "#0A66C2" },
        tiktok: { name: "TikTok", icon: "fab fa-tiktok", color: "#000000" },
      };
      
      const platformInfo = platformMap[platformId.toLowerCase()] || {
        name: platformId,
        icon: "fab fa-social",
        color: "#333333"
      };
      
      return await this.createPlatform({
        name: platformInfo.name,
        icon: platformInfo.icon,
        color: platformInfo.color,
        isConnected: true,
        userId,
        accountId: platformUserId || `${platformId}_${userId}`,
        accessToken: accessToken || null,
      });
    }
  }

  async disconnectPlatform(userId: string, platformId: string): Promise<boolean> {
    const platforms = Array.from(this.platforms.values())
      .filter(p => p.userId === userId && (p.name === platformId || p.id === platformId));
    
    if (platforms.length === 0) return false;
    
    // Update platform to disconnected status
    for (const platform of platforms) {
      const updatedPlatform = {
        ...platform,
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        connectionStatus: "disconnected",
        updatedAt: new Date(),
      };
      this.platforms.set(platform.id, updatedPlatform);
    }
    
    return true;
  }

  // Campaigns
  async getCampaignsByUserId(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      ...insertCampaign,
      id,
      status: insertCampaign.status || "draft",
      description: insertCampaign.description || null,
      productName: insertCampaign.productName || null,
      colorScheme: insertCampaign.colorScheme || null,
      postsPerDay: insertCampaign.postsPerDay || 1,
      keyMessages: (insertCampaign.keyMessages as string[]) ?? [],
      generationProgress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...updates, updatedAt: new Date() };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Posts
  async getPostsByUserId(userId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getPostsByStatus(userId: string, status: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId && post.status === status)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getPostsByCampaignId(campaignId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.campaignId === campaignId)
      .sort((a, b) => {
        // Sort by scheduledFor date if available, otherwise by createdAt
        const dateA = a.scheduledFor ? new Date(a.scheduledFor) : new Date(a.createdAt!);
        const dateB = b.scheduledFor ? new Date(b.scheduledFor) : new Date(b.createdAt!);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getPost(id: string): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      ...insertPost,
      id,
      platforms: (insertPost.platforms as string[]) || ["Instagram"],
      campaignId: insertPost.campaignId || null,
      imageUrl: insertPost.imageUrl || null,
      videoUrl: insertPost.videoUrl || null,
      imagePrompt: insertPost.imagePrompt || null,
      videoPrompt: insertPost.videoPrompt || null,
      scheduledFor: insertPost.scheduledFor || null,
      aiGenerated: insertPost.aiGenerated ?? null,
      publishedAt: null,
      mediaUrls: (insertPost.mediaUrls as string[]) ?? [],
      approvedBy: null,
      rejectionReason: null,
      engagementData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...updates, updatedAt: new Date() };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  // AI Suggestions
  async getAiSuggestionsByUserId(userId: string): Promise<AiSuggestion[]> {
    return Array.from(this.aiSuggestions.values())
      .filter(suggestion => suggestion.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createAiSuggestion(insertSuggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const id = randomUUID();
    const suggestion: AiSuggestion = {
      id,
      userId: insertSuggestion.userId,
      prompt: insertSuggestion.prompt,
      suggestions: insertSuggestion.suggestions as string[],
      selected: insertSuggestion.selected ?? null,
      createdAt: new Date(),
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }

  // Analytics
  async getAnalyticsByUserId(userId: string): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(analytics => analytics.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getAnalyticsByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(analytics => 
        analytics.userId === userId &&
        new Date(analytics.date) >= startDate &&
        new Date(analytics.date) <= endDate
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const analytics: Analytics = {
      ...insertAnalytics,
      id,
      createdAt: new Date(),
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }

  // User Subscriptions
  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    return Array.from(this.userSubscriptions.values())
      .find(sub => sub.userId === userId && sub.status === "active");
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const id = randomUUID();
    const userSub: UserSubscription = {
      ...subscription,
      id,
      startDate: subscription.startDate || new Date(),
      autoRenew: subscription.autoRenew ?? true,
      cancelledAt: subscription.cancelledAt ?? null,
      nextBillingDate: subscription.nextBillingDate ?? null,
      createdAt: new Date(),
    };
    this.userSubscriptions.set(id, userSub);
    return userSub;
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const subscription = this.userSubscriptions.get(id);
    if (!subscription) return undefined;
    
    const updated = { ...subscription, ...updates };
    this.userSubscriptions.set(id, updated);
    return updated;
  }

  // Credit Transactions
  async getCreditTransactionsByUserId(userId: string): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const id = randomUUID();
    const creditTx: CreditTransaction = {
      ...transaction,
      id,
      metadata: transaction.metadata || null,
      createdAt: new Date(),
    };
    this.creditTransactions.set(id, creditTx);
    return creditTx;
  }

  // Usage Tracking
  async getUsageByUserId(userId: string): Promise<UsageTracking[]> {
    return Array.from(this.usageTracking.values())
      .filter(u => u.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createUsageTracking(usage: InsertUsageTracking): Promise<UsageTracking> {
    const id = randomUUID();
    const usageTrack: UsageTracking = {
      ...usage,
      id,
      metadata: usage.metadata || null,
      postId: usage.postId || null,
      createdAt: new Date(),
    };
    this.usageTracking.set(id, usageTrack);
    return usageTrack;
  }
}

export const storage = new MemStorage();
