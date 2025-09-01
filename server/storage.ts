import { type User, type InsertUser, type Platform, type InsertPlatform, type Post, type InsertPost, type AiSuggestion, type InsertAiSuggestion, type Analytics, type InsertAnalytics, type Campaign, type InsertCampaign } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Platforms
  getPlatformsByUserId(userId: string): Promise<Platform[]>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | undefined>;
  
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
    // Create demo user
    const demoUser: User = {
      id: "demo-user-1",
      username: "sarah.johnson",
      password: "demo123",
      fullName: "Sarah Johnson",
      businessName: "Sarah's Corner Café",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create connected platforms
    const platforms: Platform[] = [
      {
        id: randomUUID(),
        name: "Instagram",
        icon: "fab fa-instagram",
        color: "#E1306C",
        isConnected: true,
        userId: demoUser.id,
        accountId: "cafe_instagram",
        accessToken: "ig_token_123",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Facebook",
        icon: "fab fa-facebook",
        color: "#1877F2",
        isConnected: true,
        userId: demoUser.id,
        accountId: "cafe_facebook",
        accessToken: "fb_token_123",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "X (Twitter)",
        icon: "fab fa-twitter",
        color: "#1DA1F2",
        isConnected: true,
        userId: demoUser.id,
        accountId: "cafe_twitter",
        accessToken: "twitter_token_123",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "TikTok",
        icon: "fab fa-tiktok",
        color: "#000000",
        isConnected: true,
        userId: demoUser.id,
        accountId: "cafe_tiktok",
        accessToken: "tiktok_token_123",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "LinkedIn",
        icon: "fab fa-linkedin",
        color: "#0A66C2",
        isConnected: true,
        userId: demoUser.id,
        accountId: "cafe_linkedin",
        accessToken: "linkedin_token_123",
        createdAt: new Date(),
      },
    ];

    platforms.forEach(platform => this.platforms.set(platform.id, platform));

    // Create sample posts
    const posts: Post[] = [
      {
        id: randomUUID(),
        userId: demoUser.id,
        content: "🥞 Weekend brunch is here! Join us for fluffy pancakes, fresh fruit, and the best coffee in town. Perfect way to start your Saturday! #WeekendBrunch #CafeLife #FreshEats",
        platforms: ["Facebook", "Instagram"],
        status: "pending",
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        publishedAt: null,
        mediaUrls: ["https://example.com/brunch-image.jpg"],
        aiGenerated: true,
        approvedBy: null,
        rejectionReason: null,
        engagementData: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        content: "☕ Coffee Tip Tuesday: Did you know that grinding your coffee beans right before brewing preserves the oils and gives you the freshest flavor? Try it and taste the difference! #CoffeeTips #FreshBrew",
        platforms: ["X (Twitter)", "LinkedIn"],
        status: "pending",
        scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        publishedAt: null,
        mediaUrls: [],
        aiGenerated: false,
        approvedBy: null,
        rejectionReason: null,
        engagementData: null,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        content: "✨ Watch our skilled barista create the perfect latte art! Each cup is crafted with love and precision. What's your favorite latte art design? 🎨☕ #LatteArt #BehindTheScenes #CoffeeArt",
        platforms: ["Instagram"],
        status: "pending",
        scheduledFor: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        publishedAt: null,
        mediaUrls: ["https://example.com/latte-art-video.mp4"],
        aiGenerated: true,
        approvedBy: null,
        rejectionReason: null,
        engagementData: null,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        content: "☕ Start your Monday with our signature blend! What's your go-to morning coffee order? #MondayMotivation #CoffeeLovers",
        platforms: ["Instagram", "Facebook", "X (Twitter)"],
        status: "published",
        scheduledFor: null,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        mediaUrls: ["https://example.com/monday-coffee.jpg"],
        aiGenerated: true,
        approvedBy: null,
        rejectionReason: null,
        engagementData: {
          likes: 324,
          comments: 45,
          shares: 12,
          clicks: 89,
          reach: 1580,
        },
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];

    posts.forEach(post => this.posts.set(post.id, post));
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
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
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

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      ...insertCampaign,
      id,
      keyMessages: insertCampaign.keyMessages ?? [],
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
      mediaUrls: insertPost.mediaUrls ?? [],
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
      suggestions: insertSuggestion.suggestions,
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
