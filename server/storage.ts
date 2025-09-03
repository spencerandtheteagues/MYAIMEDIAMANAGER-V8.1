import { type User, type InsertUser, type Platform, type InsertPlatform, type Post, type InsertPost, type AiSuggestion, type InsertAiSuggestion, type Analytics, type InsertAnalytics, type Campaign, type InsertCampaign } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private platforms: Map<string, Platform>;
  private campaigns: Map<string, Campaign>;
  private posts: Map<string, Post>;
  private aiSuggestions: Map<string, AiSuggestion>;
  private analytics: Map<string, Analytics>;

  constructor() {
    this.users = new Map();
    this.platforms = new Map();
    this.campaigns = new Map();
    this.posts = new Map();
    this.aiSuggestions = new Map();
    this.analytics = new Map();
    
    // Initialize with demo user and data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user with admin credentials
    const demoUser: User = {
      id: "demo-user-1",
      username: "spencer.teague",
      password: "TheMoonKey8!",
      fullName: "Spencer Teague",
      businessName: "MyAiMediaMgr",
      avatar: null,
      googleAvatar: null,
      role: "admin",
      tier: "enterprise",
      credits: 999999999,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
    };
    const demoUserWithPaid = { ...demoUser, isPaid: true } as User & { isPaid: boolean };
    this.users.set(demoUser.id, demoUserWithPaid as any);

    // NO FAKE PLATFORMS - User must connect real platforms through OAuth
    // NO FAKE POSTS - All content must be created by user
    // NO FAKE ANALYTICS - All metrics must come from real platform data
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
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
}

export const storage = new MemStorage();
