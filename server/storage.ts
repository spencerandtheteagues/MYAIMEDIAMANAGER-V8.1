import { 
  type User, type InsertUser, type UpsertUser,
  type Platform, type InsertPlatform, 
  type Post, type InsertPost, 
  type AiSuggestion, type InsertAiSuggestion, 
  type Analytics, type InsertAnalytics, 
  type Campaign, type InsertCampaign,
  type CreditTransaction, type InsertCreditTransaction,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type AdminAction, type InsertAdminAction,
  type Notification, type InsertNotification,
  type ContentLibraryItem, type InsertContentLibrary,
  type BrandProfile, type InsertBrandProfile,
  type ContentFeedback, type InsertContentFeedback,
  type Referral, type InsertReferral
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Platforms
  getPlatformsByUserId(userId: string): Promise<Platform[]>;
  getPlatformById(id: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined>;
  
  // Campaigns
  getCampaignsByUserId(userId: string): Promise<Campaign[]>;
  getCampaignsByStatus(userId: string, status: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;
  getCampaigns(userId: string): Promise<Campaign[]>;
  
  // Posts
  getPostsByUserId(userId: string): Promise<Post[]>;
  getPostsByStatus(userId: string, status: string): Promise<Post[]>;
  getPostsByCampaignId(campaignId: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  getScheduledPostAtTime(userId: string, scheduledTime: Date): Promise<Post | undefined>;
  
  // Schedule-specific methods
  getScheduledPosts(params: { from: Date; to: Date; userId: string }): Promise<Post[]>;
  getPosts(params: { userId: string; status?: string }): Promise<Post[]>;
  checkScheduleConflicts(params: { 
    userId: string; 
    platform: string; 
    scheduledAt: Date; 
    duration: number;
    excludeId?: string;
  }): Promise<Post[]>;
  
  // AI Suggestions
  getAiSuggestionsByUserId(userId: string): Promise<AiSuggestion[]>;
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  
  // Analytics
  getAnalyticsByUserId(userId: string): Promise<Analytics[]>;
  getAnalyticsByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  
  // Credit Transactions
  getCreditTransactionsByUserId(userId: string): Promise<CreditTransaction[]>;
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  
  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanByTier(tier: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  
  // Admin Actions
  logAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActionsByTargetUser(userId: string): Promise<AdminAction[]>;
  
  // Notifications
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createGlobalNotification(notification: Omit<InsertNotification, 'userId'>): Promise<void>;
  getUnreadPopupMessages(userId: string): Promise<Notification[]>;
  markMessageDelivered(notificationId: string): Promise<Notification | undefined>;
  
  // Content Library
  getContentLibraryByUserId(userId: string): Promise<ContentLibraryItem[]>;
  searchContentLibrary(userId: string, query: string): Promise<ContentLibraryItem[]>;
  createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibraryItem>;
  updateContentLibraryItem(id: string, userId: string, updates: Partial<ContentLibraryItem>): Promise<ContentLibraryItem | undefined>;
  deleteContentLibraryItem(id: string, userId?: string): Promise<boolean>;
  incrementUsageCount(id: string): Promise<void>;
  
  // Brand Profile
  getBrandProfile(userId: string): Promise<BrandProfile | undefined>;
  createBrandProfile(profile: InsertBrandProfile): Promise<BrandProfile>;
  updateBrandProfile(userId: string, updates: Partial<BrandProfile>): Promise<BrandProfile | undefined>;
  
  // Content Feedback
  createContentFeedback(feedback: InsertContentFeedback): Promise<ContentFeedback>;
  getContentFeedbackByUserId(userId: string): Promise<ContentFeedback[]>;
  getContentFeedbackByContent(contentId: string): Promise<ContentFeedback[]>;
  
  // Advanced Admin Operations
  deleteUser(id: string): Promise<boolean>; // Permanently delete user
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  suspendUser(id: string, reason?: string): Promise<User | undefined>;
  setUserAdmin(id: string, isAdmin: boolean): Promise<User | undefined>;
  updateUserEmail(id: string, email: string): Promise<User | undefined>;
  resetUserCredits(id: string, amount: number): Promise<User | undefined>;
  getUserCreditHistory(userId: string): Promise<CreditTransaction[]>;
  getSystemStats(): Promise<any>;
  getAllTransactions(): Promise<CreditTransaction[]>;
  
  // User activity and pause/unpause
  pauseUser(userId: string, reason: string): Promise<User | undefined>;
  unpauseUser(userId: string): Promise<User | undefined>;
  updateUserActivity(userId: string): Promise<User | undefined>;
  sendMessageToUser(userId: string, title: string, message: string, requiresPopup?: boolean): Promise<Notification>;
  updateTrialPeriod(userId: string, endDate: Date): Promise<User | undefined>;
  
  // Referral system
  generateReferralCode(userId: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  getReferralsByUser(userId: string): Promise<Referral[]>;
  completeReferral(referralId: string, creditsEarned: number): Promise<Referral | undefined>;
  getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    creditsEarned: number;
    pendingReferrals: number;
  }>;

  // Enhanced Admin Methods for God-like Powers
  getUserLastActivity(userId: string): Promise<Date | null>;
  getUserLoginHistory(userId: string, limit: number): Promise<Array<{ timestamp: Date; ip?: string; userAgent?: string }>>;
  getUserMessages(userId: string, unreadOnly: boolean): Promise<Notification[]>;
  createUrgentMessage(data: {
    userId: string;
    title: string;
    message: string;
    priority: string;
    requiresPopup?: boolean;
    requiresAcknowledgment?: boolean;
    expiresAt?: Date;
    adminId?: string;
  }): Promise<Notification>;
  createImpersonationSession(data: {
    adminId: string;
    userId: string;
    reason: string;
    expiresAt: Date;
  }): Promise<{ id: string; token: string; }>;
  getOnlineUserCount(): Promise<number>;
  getSignupsCount(hours: number): Promise<number>;
  getActiveTrialsCount(): Promise<number>;
  getExpiredTrialsCount(): Promise<number>;
  getTotalRevenue(): Promise<number>;
  getMonthlyRevenue(): Promise<number>;
  getAverageRevenuePerUser(): Promise<number>;
  getChurnRate(): Promise<number>;
  getSystemAlerts(): Promise<Array<{ id: string; type: string; message: string; severity: string; timestamp: Date }>>;
  getSubscriptionHistory(userId: string): Promise<Array<{ date: Date; tier: string; action: string }>>;
  getStripeInvoices(customerId: string): Promise<Array<any>>;
  getPaymentMethods(customerId: string): Promise<Array<any>>;
  getUserUsageStats(userId: string): Promise<{
    postsGenerated: number;
    creditsUsed: number;
    campaignsCreated: number;
    platformsConnected: number;
    avgEngagement: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private platforms: Map<string, Platform>;
  private campaigns: Map<string, Campaign>;
  private posts: Map<string, Post>;
  private aiSuggestions: Map<string, AiSuggestion>;
  private analytics: Map<string, Analytics>;
  private creditTransactions: Map<string, CreditTransaction>;
  private subscriptionPlans: Map<string, SubscriptionPlan>;
  private adminActions: Map<string, AdminAction>;
  private notifications: Map<string, Notification>;
  private contentLibrary: Map<string, ContentLibraryItem>;
  private brandProfiles: Map<string, BrandProfile>;
  private contentFeedback: Map<string, ContentFeedback>;
  private referrals: Map<string, Referral>;
  private urgentMessages: Map<string, any>;
  private impersonationSessions: Map<string, any>;
  private loginHistory: Map<string, Array<{ timestamp: Date; ip?: string; userAgent?: string }>>;
  private systemAlerts: Map<string, any>;
  private subscriptionHistory: Map<string, Array<any>>;

  constructor() {
    this.users = new Map();
    this.platforms = new Map();
    this.campaigns = new Map();
    this.posts = new Map();
    this.aiSuggestions = new Map();
    this.analytics = new Map();
    this.creditTransactions = new Map();
    this.subscriptionPlans = new Map();
    this.adminActions = new Map();
    this.notifications = new Map();
    this.contentLibrary = new Map();
    this.brandProfiles = new Map();
    this.contentFeedback = new Map();
    this.referrals = new Map();
    this.urgentMessages = new Map();
    this.impersonationSessions = new Map();
    this.loginHistory = new Map();
    this.systemAlerts = new Map();
    this.subscriptionHistory = new Map();

    // Initialize with demo user and data
    this.initializeDemoData().catch(console.error);
    this.initializeSubscriptionPlans();
  }

  private async initializeDemoData() {
    // Import bcrypt for password hashing
    const bcrypt = await import("bcryptjs");

    // Create admin users with secure password handling
    // Passwords must be set via environment variables or admin panel
    const adminUsers = [
      {
        id: "admin-user-1",
        email: "admin@myaimediamgr.com",
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        fullName: "Admin User",
        businessName: "MyAiMediaMgr"
      },
      {
        id: "admin-user-2",
        email: "spencertheteague@gmail.com",
        username: "spencertheteague",
        firstName: "Spencer",
        lastName: "Teague",
        fullName: "Spencer Teague",
        businessName: "MyAiMediaMgr"
      },
      {
        id: "admin-user-3",
        email: "jaysonpowers505@gmail.com",
        username: "jaysonpowers",
        firstName: "Jayson",
        lastName: "Powers",
        fullName: "Jayson Powers",
        businessName: "MyAiMediaMgr"
      },
      {
        id: "admin-user-4",
        email: "spencer@myaimediamgr.com",
        username: "spencer.teague",
        firstName: "Spencer",
        lastName: "Teague",
        fullName: "Spencer Teague",
        businessName: "MyAiMediaMgr"
      }
    ];

    // Create each admin user without passwords (OAuth only or set via admin panel)
    for (const adminData of adminUsers) {
      // Check if user already exists to avoid duplicates
      const existingUser = Array.from(this.users.values()).find(u => u.email === adminData.email);
      if (existingUser) continue;

      const adminUser: User = {
        id: adminData.id,
        email: adminData.email,
        username: adminData.username,
        password: null, // Password must be set securely via admin panel or OAuth
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        fullName: adminData.fullName,
        profileImageUrl: null,
        businessName: adminData.businessName,
        avatar: null,
        googleAvatar: null,
        role: "admin",
        isAdmin: true,
        accountStatus: "active",
        tier: "enterprise",
        subscriptionStatus: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        credits: 999999999,
        freeCreditsUsed: false,
        totalCreditsUsed: 0,
        emailVerified: true,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isPaid: true,
        needsTrialSelection: false, // Admins don't need trial selection
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      this.users.set(adminUser.id, adminUser);
    }

    // NO FAKE PLATFORMS - User must connect real platforms through OAuth
    // NO FAKE POSTS - All content must be created by user
    // NO FAKE ANALYTICS - All metrics must come from real platform data
  }

  private initializeSubscriptionPlans() {
    const plans: SubscriptionPlan[] = [
      {
        id: "plan-starter",
        tier: "starter",
        name: "Starter",
        priceMonthly: "19",
        creditsPerMonth: 190,
        features: [
          "190 credits per month",
          "1 campaign: 14 image+text posts (2 per day/7 days)",
          "3 social media accounts",
          "AI content generation",
          "Analytics dashboard",
          "Email support"
        ] as any,
        stripePriceId: null,
        maxCampaigns: 1,
        hasVideoGeneration: true,
        hasAiAssistant: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "plan-professional",
        tier: "professional",
        name: "Professional",
        priceMonthly: "49",
        creditsPerMonth: 500,
        features: [
          "500 credits per month",
          "10 social media accounts",
          "Unlimited posts",
          "Advanced AI content generation",
          "Full analytics suite",
          "Priority email support (24hr)",
          "Team collaboration (3 users)",
          "Content approval workflow",
          "Custom branding"
        ] as any,
        stripePriceId: null,
        maxCampaigns: 20,
        hasVideoGeneration: true,
        hasAiAssistant: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "plan-enterprise",
        tier: "enterprise",
        name: "Enterprise",
        priceMonthly: "199",
        creditsPerMonth: 2000,
        features: [
          "2000 credits per month",
          "Unlimited social media accounts",
          "Unlimited posts",
          "Advanced AI with custom models",
          "White-label options",
          "Dedicated account manager",
          "Unlimited team members",
          "API access",
          "Custom integrations",
          "SLA guarantee"
        ] as any,
        stripePriceId: null,
        maxCampaigns: 999,
        hasVideoGeneration: true,
        hasAiAssistant: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    plans.forEach(plan => this.subscriptionPlans.set(plan.id, plan));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      // Never return password in user data
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      businessName: insertUser.businessName ?? null,
      avatar: insertUser.avatar ?? null,
      googleAvatar: insertUser.googleAvatar ?? null,
      role: insertUser.role ?? "user",
      tier: insertUser.tier ?? "free",
      credits: insertUser.credits ?? 50,
      stripeCustomerId: insertUser.stripeCustomerId ?? null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId ?? null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(upsertUser.id);
    
    if (existingUser) {
      const updatedUser = { ...existingUser, ...upsertUser, updatedAt: new Date() };
      this.users.set(upsertUser.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: upsertUser.id,
        email: upsertUser.email ?? null,
        username: upsertUser.email?.split('@')[0] ?? upsertUser.id,
        password: null,
        fullName: `${upsertUser.firstName || ''} ${upsertUser.lastName || ''}`.trim() || null,
        businessName: null,
        avatar: upsertUser.profileImageUrl ?? null,
        googleAvatar: upsertUser.profileImageUrl ?? null,
        firstName: upsertUser.firstName ?? null,
        lastName: upsertUser.lastName ?? null,
        profileImageUrl: upsertUser.profileImageUrl ?? null,
        role: "user",
        tier: "free",
        credits: 50,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        isAdmin: false,
        accountStatus: "active",
        subscriptionStatus: "trial",
        freeCreditsUsed: false,
        totalCreditsUsed: 0,
        isPaid: false,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .map(user => {
        // Never return password in user data
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Platforms
  async getPlatformsByUserId(userId: string): Promise<Platform[]> {
    return Array.from(this.platforms.values()).filter(platform => platform.userId === userId);
  }

  async getPlatformById(id: string): Promise<Platform | undefined> {
    return this.platforms.get(id);
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
      createdAt: new Date(),
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

  async deletePlatform(id: string): Promise<void> {
    this.platforms.delete(id);
  }

  // Campaigns
  async getCampaignsByUserId(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getCampaignsByStatus(userId: string, status: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.userId === userId && campaign.status === status)
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
      keyMessages: Array.isArray(insertCampaign.keyMessages) ? insertCampaign.keyMessages : [],
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
  
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return this.getCampaignsByUserId(userId);
  }
  
  async getScheduledPostAtTime(userId: string, scheduledTime: Date): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(post => {
      if (post.userId !== userId || !post.scheduledFor) return false;
      const postTime = new Date(post.scheduledFor);
      return Math.abs(postTime.getTime() - scheduledTime.getTime()) < 60000; // Within 1 minute
    });
  }

  async getScheduledPosts(params: { from: Date; to: Date; userId: string }): Promise<Post[]> {
    const fromTime = params.from.getTime();
    const toTime = params.to.getTime();
    
    return Array.from(this.posts.values())
      .filter(post => {
        if (post.userId !== params.userId) return false;
        if (!post.scheduledFor) return false;
        
        const postTime = new Date(post.scheduledFor).getTime();
        return postTime >= fromTime && postTime <= toTime;
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledFor!);
        const dateB = new Date(b.scheduledFor!);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getPosts(params: { userId: string; status?: string }): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => {
        if (post.userId !== params.userId) return false;
        if (params.status && post.status !== params.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async checkScheduleConflicts(params: { 
    userId: string; 
    platform: string; 
    scheduledAt: Date; 
    duration: number;
    excludeId?: string;
  }): Promise<Post[]> {
    const startTime = params.scheduledAt.getTime();
    const endTime = startTime + (params.duration * 60 * 1000);
    
    return Array.from(this.posts.values())
      .filter(post => {
        if (post.userId !== params.userId) return false;
        if (params.excludeId && post.id === params.excludeId) return false;
        if (!post.scheduledFor) return false;
        if (!post.platforms?.includes(params.platform)) return false;
        
        const postTime = new Date(post.scheduledFor).getTime();
        const postEndTime = postTime + (30 * 60 * 1000); // Assume 30 min duration
        
        // Check for overlap
        return (postTime < endTime && postEndTime > startTime);
      });
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
      publishedAt: null,
      mediaUrls: Array.isArray(insertPost.mediaUrls) ? insertPost.mediaUrls : [],
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
      suggestions: Array.isArray(insertSuggestion.suggestions) ? insertSuggestion.suggestions : [],
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

  // Credit Transactions
  async getCreditTransactionsByUserId(userId: string): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const id = randomUUID();
    const creditTransaction: CreditTransaction = {
      ...transaction,
      id,
      createdAt: new Date(),
    };
    this.creditTransactions.set(id, creditTransaction);
    
    // Update user credits
    const user = await this.getUser(transaction.userId);
    if (user) {
      await this.updateUser(transaction.userId, {
        credits: (user.credits || 0) + transaction.amount
      });
    }
    
    return creditTransaction;
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  async getSubscriptionPlanByTier(tier: string): Promise<SubscriptionPlan | undefined> {
    return Array.from(this.subscriptionPlans.values()).find(plan => plan.tier === tier);
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = randomUUID();
    const subscriptionPlan: SubscriptionPlan = {
      ...plan,
      id,
      features: plan.features || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptionPlans.set(id, subscriptionPlan);
    return subscriptionPlan;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const plan = this.subscriptionPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...updates };
    this.subscriptionPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  // Admin Actions
  async logAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    const id = randomUUID();
    const adminAction: AdminAction = {
      ...action,
      id,
      details: action.details || null,
      createdAt: new Date(),
    };
    this.adminActions.set(id, adminAction);
    return adminAction;
  }

  async getAdminActionsByTargetUser(userId: string): Promise<AdminAction[]> {
    return Array.from(this.adminActions.values())
      .filter(action => action.targetUserId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Notifications
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId || n.userId === null) // Include global notifications
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return userNotifications;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => (n.userId === userId || n.userId === null) && !n.read)
      .length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      userId: notification.userId || null,
      fromUserId: notification.fromUserId || null,
      actionUrl: notification.actionUrl || null,
      read: notification.read || false,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.notifications.entries()).forEach(([id, notification]) => {
      if (notification.userId === userId || notification.userId === null) {
        this.notifications.set(id, { ...notification, read: true });
      }
    });
  }

  async createGlobalNotification(notification: Omit<InsertNotification, 'userId'>): Promise<void> {
    // Get all unique user IDs
    const userIds = Array.from(this.users.keys());
    
    // Create a notification for each user
    for (const userId of userIds) {
      await this.createNotification({ ...notification, userId });
    }
  }

  // Content Library
  async getContentLibraryByUserId(userId: string): Promise<ContentLibraryItem[]> {
    return Array.from(this.contentLibrary.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async searchContentLibrary(userId: string, query: string): Promise<ContentLibraryItem[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.contentLibrary.values())
      .filter(item => {
        if (item.userId !== userId) return false;
        
        // Search in caption, business name, product name, tags, and platform
        const searchableText = [
          item.caption,
          item.businessName,
          item.productName,
          item.platform,
          ...(item.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(lowerQuery);
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibraryItem> {
    const id = randomUUID();
    const newItem: ContentLibraryItem = {
      ...item,
      id,
      thumbnail: item.thumbnail || null,
      caption: item.caption || null,
      metadata: item.metadata || null,
      tags: item.tags || null,
      businessName: item.businessName || null,
      productName: item.productName || null,
      platform: item.platform || null,
      usageCount: item.usageCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contentLibrary.set(id, newItem);
    return newItem;
  }

  async updateContentLibraryItem(id: string, userId: string, updates: Partial<ContentLibraryItem>): Promise<ContentLibraryItem | undefined> {
    const item = this.contentLibrary.get(id);
    if (!item || item.userId !== userId) return undefined; // Security check
    
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    this.contentLibrary.set(id, updatedItem);
    return updatedItem;
  }

  async deleteContentLibraryItem(id: string, userId?: string): Promise<boolean> {
    // Optional userId check for security, but not enforced in memory storage
    return this.contentLibrary.delete(id);
  }

  async incrementUsageCount(id: string): Promise<void> {
    const item = this.contentLibrary.get(id);
    if (item) {
      this.contentLibrary.set(id, { ...item, usageCount: (item.usageCount || 0) + 1, updatedAt: new Date() });
    }
  }
  
  // Brand Profile methods
  async getBrandProfile(userId: string): Promise<BrandProfile | undefined> {
    return Array.from(this.brandProfiles.values()).find(p => p.userId === userId);
  }

  async createBrandProfile(profile: InsertBrandProfile): Promise<BrandProfile> {
    const brandProfile: BrandProfile = {
      id: randomUUID(),
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.brandProfiles.set(brandProfile.id, brandProfile);
    return brandProfile;
  }

  async updateBrandProfile(userId: string, updates: Partial<BrandProfile>): Promise<BrandProfile | undefined> {
    const existing = await this.getBrandProfile(userId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.brandProfiles.set(existing.id, updated);
    return updated;
  }
  
  // Content Feedback methods
  async createContentFeedback(feedback: InsertContentFeedback): Promise<ContentFeedback> {
    const feedbackRecord: ContentFeedback = {
      id: randomUUID(),
      ...feedback,
      createdAt: new Date(),
    };
    this.contentFeedback.set(feedbackRecord.id, feedbackRecord);
    return feedbackRecord;
  }
  
  async getContentFeedbackByUserId(userId: string): Promise<ContentFeedback[]> {
    return Array.from(this.contentFeedback.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getContentFeedbackByContent(contentId: string): Promise<ContentFeedback[]> {
    return Array.from(this.contentFeedback.values())
      .filter(f => f.contentId === contentId);
  }
  
  // Advanced Admin Operations
  async deleteUser(id: string): Promise<boolean> {
    // Delete all user data
    const userPosts = Array.from(this.posts.values()).filter(p => p.userId === id);
    userPosts.forEach(p => this.posts.delete(p.id));
    
    const userPlatforms = Array.from(this.platforms.values()).filter(p => p.userId === id);
    userPlatforms.forEach(p => this.platforms.delete(p.id));
    
    const userCampaigns = Array.from(this.campaigns.values()).filter(c => c.userId === id);
    userCampaigns.forEach(c => this.campaigns.delete(c.id));
    
    const userNotifications = Array.from(this.notifications.values()).filter(n => n.userId === id);
    userNotifications.forEach(n => this.notifications.delete(n.id));
    
    const userLibrary = Array.from(this.contentLibrary.values()).filter(c => c.userId === id);
    userLibrary.forEach(c => this.contentLibrary.delete(c.id));
    
    // Delete the user
    return this.users.delete(id);
  }
  
  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    user.password = hashedPassword;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }
  
  async suspendUser(id: string, reason?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    user.accountStatus = "suspended";
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }
  
  async setUserAdmin(id: string, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    user.isAdmin = isAdmin;
    user.role = isAdmin ? "admin" : "user";
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }
  
  async updateUserEmail(id: string, email: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Check if email already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === email && u.id !== id);
    if (existingUser) {
      throw new Error("Email already in use");
    }
    
    user.email = email;
    user.emailVerified = false; // Reset verification status
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }
  
  async resetUserCredits(id: string, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const oldCredits = user.credits || 0;
    user.credits = amount;
    user.updatedAt = new Date();
    this.users.set(id, user);
    
    // Log the transaction
    const transaction: CreditTransaction = {
      id: randomUUID(),
      userId: id,
      amount: amount - oldCredits,
      type: "admin_reset",
      description: `Admin reset credits to ${amount}`,
      stripePaymentIntentId: null,
      createdAt: new Date()
    };
    this.creditTransactions.set(transaction.id, transaction);
    
    return user;
  }
  
  async getUserCreditHistory(userId: string): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getAllTransactions(): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async pauseUser(userId: string, reason: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      accountStatus: "frozen",
      pausedAt: new Date(),
      pausedReason: reason,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async unpauseUser(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      accountStatus: "active",
      pausedAt: null,
      pausedReason: null,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserActivity(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      lastActivityAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async sendMessageToUser(userId: string, title: string, message: string, requiresPopup: boolean = true): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      id,
      userId,
      fromUserId: null, // Admin message
      type: "admin_message",
      title,
      message,
      actionUrl: null,
      read: false,
      requiresPopup,
      deliveredAt: null,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateTrialPeriod(userId: string, endDate: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      trialEndDate: endDate,
      trialEndsAt: endDate,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUnreadPopupMessages(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => 
        n.userId === userId && 
        n.requiresPopup === true && 
        !n.deliveredAt
      )
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async markMessageDelivered(notificationId: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return undefined;
    
    const updatedNotification = { 
      ...notification, 
      deliveredAt: new Date(),
      read: true
    };
    this.notifications.set(notificationId, updatedNotification);
    return updatedNotification;
  }
  
  async getSystemStats(): Promise<any> {
    const allUsers = Array.from(this.users.values());
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
    
    const allTransactions = Array.from(this.creditTransactions.values());
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
      totalPosts: this.posts.size,
      totalCampaigns: this.campaigns.size,
      totalRevenue,
      totalTransactions: allTransactions.length,
    };
  }

  // Referral system methods
  async generateReferralCode(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    // Generate unique 8-character referral code
    let referralCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      isUnique = !Array.from(this.users.values()).some(u => u.referralCode === referralCode);
    }
    
    const updatedUser = { 
      ...user, 
      referralCode, 
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.referralCode === referralCode);
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      ...insertReferral,
      id,
      completedAt: null,
      createdAt: new Date(),
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter(referral => referral.referrerId === referrerId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter(referral => referral.referredUserId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async completeReferral(referralId: string, creditsEarned: number): Promise<Referral | undefined> {
    const referral = this.referrals.get(referralId);
    if (!referral) return undefined;

    const updatedReferral = {
      ...referral,
      status: "completed" as const,
      creditsEarned,
      completedAt: new Date(),
    };
    this.referrals.set(referralId, updatedReferral);
    return updatedReferral;
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    creditsEarned: number;
    pendingReferrals: number;
  }> {
    const referrals = await this.getReferralsByReferrer(userId);
    const completed = referrals.filter(r => r.status === "completed");
    const pending = referrals.filter(r => r.status === "pending");
    const creditsEarned = completed.reduce((sum, r) => sum + (r.creditsEarned || 0), 0);

    return {
      totalReferrals: referrals.length,
      completedReferrals: completed.length,
      creditsEarned,
      pendingReferrals: pending.length,
    };
  }

  // Enhanced Admin Methods Implementation
  async getUserLastActivity(userId: string): Promise<Date | null> {
    const user = this.users.get(userId);
    return user?.lastActivityAt || user?.lastLoginAt || null;
  }

  async getUserLoginHistory(userId: string, limit: number): Promise<Array<{ timestamp: Date; ip?: string; userAgent?: string }>> {
    const history = this.loginHistory.get(userId) || [];
    return history.slice(0, limit).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getUserMessages(userId: string, unreadOnly: boolean): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => {
        if (n.userId !== userId) return false;
        if (unreadOnly && n.read) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
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
    const id = randomUUID();
    const urgentMessage: Notification = {
      id,
      userId: data.userId,
      fromUserId: data.adminId || null,
      type: "urgent_message",
      title: data.title,
      message: data.message,
      actionUrl: null,
      read: false,
      requiresPopup: data.requiresPopup || false,
      deliveredAt: null,
      priority: data.priority,
      expiresAt: data.expiresAt,
      requiresAcknowledgment: data.requiresAcknowledgment || false,
      createdAt: new Date()
    };
    this.notifications.set(id, urgentMessage);
    this.urgentMessages.set(id, urgentMessage);
    return urgentMessage;
  }

  async createImpersonationSession(data: {
    adminId: string;
    userId: string;
    reason: string;
    expiresAt: Date;
  }): Promise<{ id: string; token: string; }> {
    const id = randomUUID();
    const token = randomUUID();
    const session = {
      id,
      token,
      adminId: data.adminId,
      userId: data.userId,
      reason: data.reason,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      active: true
    };
    this.impersonationSessions.set(id, session);
    return { id, token };
  }

  async getOnlineUserCount(): Promise<number> {
    // Simple implementation - users active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = Array.from(this.users.values()).filter(user => {
      const lastActivity = user.lastActivityAt || user.lastLoginAt;
      return lastActivity && new Date(lastActivity) > fiveMinutesAgo;
    });
    return onlineUsers.length;
  }

  async getSignupsCount(hours: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.users.values()).filter(user =>
      user.createdAt && new Date(user.createdAt) > cutoffTime
    ).length;
  }

  async getActiveTrialsCount(): Promise<number> {
    const now = new Date();
    return Array.from(this.users.values()).filter(user => {
      if (user.tier !== 'free' || user.isPaid) return false;
      const trialEnd = user.trialEndDate || user.trialEndsAt;
      return trialEnd && new Date(trialEnd) > now;
    }).length;
  }

  async getExpiredTrialsCount(): Promise<number> {
    const now = new Date();
    return Array.from(this.users.values()).filter(user => {
      if (user.tier !== 'free' || user.isPaid) return false;
      const trialEnd = user.trialEndDate || user.trialEndsAt;
      return trialEnd && new Date(trialEnd) <= now;
    }).length;
  }

  async getTotalRevenue(): Promise<number> {
    return Array.from(this.creditTransactions.values())
      .filter(t => t.type === "purchase" && t.amount > 0)
      .reduce((sum, t) => sum + (t.amount * 0.1), 0); // $0.10 per credit
  }

  async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return Array.from(this.creditTransactions.values())
      .filter(t =>
        t.type === "purchase" &&
        t.amount > 0 &&
        new Date(t.createdAt!) >= firstOfMonth
      )
      .reduce((sum, t) => sum + (t.amount * 0.1), 0);
  }

  async getAverageRevenuePerUser(): Promise<number> {
    const totalRevenue = await this.getTotalRevenue();
    const paidUsers = Array.from(this.users.values()).filter(u => u.isPaid).length;
    return paidUsers > 0 ? totalRevenue / paidUsers : 0;
  }

  async getChurnRate(): Promise<number> {
    // Simple churn calculation - cancelled subscriptions in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalPaidUsers = Array.from(this.users.values()).filter(u => u.isPaid).length;
    const churned = Array.from(this.users.values()).filter(u =>
      u.subscriptionStatus === "cancelled" &&
      u.updatedAt &&
      new Date(u.updatedAt) > thirtyDaysAgo
    ).length;
    return totalPaidUsers > 0 ? (churned / totalPaidUsers) * 100 : 0;
  }

  async getSystemAlerts(): Promise<Array<{ id: string; type: string; message: string; severity: string; timestamp: Date }>> {
    const alerts = [];

    // Check for system issues
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

    const lowCreditUsers = Array.from(this.users.values()).filter(u =>
      u.credits && u.credits < 10 && !u.isPaid
    ).length;
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
    return this.subscriptionHistory.get(userId) || [];
  }

  async getStripeInvoices(customerId: string): Promise<Array<any>> {
    // Mock Stripe invoices - in real implementation, would call Stripe API
    return [];
  }

  async getPaymentMethods(customerId: string): Promise<Array<any>> {
    // Mock payment methods - in real implementation, would call Stripe API
    return [];
  }

  async getUserUsageStats(userId: string): Promise<{
    postsGenerated: number;
    creditsUsed: number;
    campaignsCreated: number;
    platformsConnected: number;
    avgEngagement: number;
  }> {
    const userPosts = Array.from(this.posts.values()).filter(p => p.userId === userId);
    const userCampaigns = Array.from(this.campaigns.values()).filter(c => c.userId === userId);
    const userPlatforms = Array.from(this.platforms.values()).filter(p => p.userId === userId);
    const user = this.users.get(userId);

    return {
      postsGenerated: userPosts.length,
      creditsUsed: user?.totalCreditsUsed || 0,
      campaignsCreated: userCampaigns.length,
      platformsConnected: userPlatforms.length,
      avgEngagement: 0 // Would calculate from analytics in real implementation
    };
  }
}

import { DbStorage } from "./storage.db";

// Use DbStorage in production with DATABASE_URL, MemStorage for development
export const storage = process.env.DATABASE_URL 
  ? new DbStorage() 
  : new MemStorage();
