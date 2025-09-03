import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertAiSuggestionSchema, insertCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { aiService } from "./ai-service";
import aiRoutes from "./aiRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Wire up the new AI routes exactly as specified
  app.use("/api/ai", aiRoutes);
  // Get current user (demo user for now)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser("demo-user-1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get connected platforms status - REAL CONNECTION STATUS
  app.get("/api/platforms", async (req, res) => {
    try {
      const userId = "demo-user-1";
      const platforms = await storage.getPlatformsByUserId(userId);
      
      // Return REAL platform connection status
      const platformStatus = [
        { name: "Instagram", connected: platforms.some(p => p.name === "Instagram" && p.isConnected) },
        { name: "Facebook", connected: platforms.some(p => p.name === "Facebook" && p.isConnected) },
        { name: "X.com", connected: platforms.some(p => p.name === "X (Twitter)" && p.isConnected) },
        { name: "TikTok", connected: platforms.some(p => p.name === "TikTok" && p.isConnected) },
        { name: "LinkedIn", connected: platforms.some(p => p.name === "LinkedIn" && p.isConnected) },
      ];
      
      res.json(platformStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to get platforms" });
    }
  });

  // Get user's connected platforms
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getPlatformsByUserId("demo-user-1");
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to get platforms" });
    }
  });

  // Get user's posts
  app.get("/api/posts", async (req, res) => {
    try {
      const { status } = req.query;
      let posts;
      
      if (status && typeof status === "string") {
        posts = await storage.getPostsByStatus("demo-user-1", status);
      } else {
        posts = await storage.getPostsByUserId("demo-user-1");
      }
      
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  // Get campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaignsByUserId("demo-user-1");
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to get campaigns" });
    }
  });

  // Get campaign by ID
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to get campaign" });
    }
  });

  // Get posts for a campaign
  app.get("/api/campaigns/:id/posts", async (req, res) => {
    try {
      const posts = await storage.getPostsByCampaignId(req.params.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get campaign posts" });
    }
  });

  // Create campaign
  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        userId: "demo-user-1",
        startDate: req.body.startDate,
        endDate: req.body.endDate || new Date(new Date(req.body.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Update campaign
  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // Generate campaign content
  app.post("/api/campaigns/:id/generate", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Update campaign status to generating
      await storage.updateCampaign(campaign.id, { status: "generating" });

      // Generate campaign posts asynchronously
      (async () => {
        try {
          const startDate = new Date(campaign.startDate);
          const endDate = new Date(campaign.endDate || startDate);
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const totalPosts = Math.min(days * 2, 14); // 2 posts per day, max 14 posts

          const posts = [];
          for (let i = 0; i < totalPosts; i++) {
            const dayOffset = Math.floor(i / 2);
            const isAfternoonPost = i % 2 === 1;
            const scheduledDate = new Date(startDate);
            scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
            scheduledDate.setHours(isAfternoonPost ? 15 : 9, 0, 0, 0);

            // Generate content for each post
            const topic = `${campaign.businessName} ${campaign.productName || 'product'} - ${campaign.callToAction}`;
            const contentSuggestions = await aiService.generateContent({
              topic,
              tone: campaign.brandTone,
              platform: campaign.platform,
              includeHashtags: true,
              includeEmojis: true,
              length: "medium",
            });

            let imageUrl = null;
            if (campaign.visualStyle) {
              const imageResult = await aiService.generateImage({
                prompt: `${campaign.businessName} ${campaign.productName || ''} ${campaign.visualStyle}`,
                style: campaign.visualStyle,
                aspectRatio: campaign.platform === "Instagram" ? "1:1" : "16:9",
              });
              imageUrl = imageResult.url;
            }

            posts.push({
              content: contentSuggestions[0],
              imageUrl,
              scheduledFor: scheduledDate,
            });

            // Update progress
            const progress = Math.round(((i + 1) / totalPosts) * 100);
            await storage.updateCampaign(campaign.id, { generationProgress: progress });
          }

          // Create posts in storage
          for (const post of posts) {
            await storage.createPost({
              userId: campaign.userId,
              campaignId: campaign.id,
              content: post.content,
              mediaUrls: post.imageUrl ? [post.imageUrl] : [],
              platforms: [campaign.platform],
              status: "pending",
              scheduledFor: post.scheduledFor,
              aiGenerated: true,
            });
          }

          // Update campaign status to review
          await storage.updateCampaign(campaign.id, { 
            status: "review",
            generationProgress: 100,
          });
        } catch (error) {
          console.error("Failed to generate campaign:", error);
          await storage.updateCampaign(campaign.id, { 
            status: "draft",
            generationProgress: 0,
          });
        }
      })();

      res.json({ message: "Campaign generation started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate campaign" });
    }
  });

  // Create new post
  app.post("/api/posts", async (req, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        userId: "demo-user-1",
      });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Update post
  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const post = await storage.updatePost(id, updates);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Delete post
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePost(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Generate AI content suggestions
  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Generate AI suggestions using real AI
      const suggestions = await generateAISuggestions(prompt);
      
      const aiSuggestion = await storage.createAiSuggestion({
        userId: "demo-user-1",
        prompt,
        suggestions,
        selected: false,
      });

      res.json(aiSuggestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI suggestions" });
    }
  });

  // Generate AI content with enhanced parameters
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const {
        topic,
        tone,
        platform,
        contentType,
        includeHashtags = true,
        includeEmojis = true,
        length = "medium",
        generateImage,
        imageStyle,
        generateVideo,
        videoStyle,
      } = req.body;

      let content = null;
      let imageUrl = null;
      let videoUrl = null;
      let hashtags = [];

      // Generate text content
      if (contentType === "text" || !contentType) {
        const suggestions = await aiService.generateContent({
          topic: topic || "social media post",
          tone: tone || "professional",
          platform: platform || "Instagram",
          includeHashtags,
          includeEmojis,
          length,
        });
        content = suggestions[0]; // Use the first suggestion
        
        // Generate hashtags separately if needed
        if (includeHashtags && content) {
          hashtags = await aiService.generateHashtags(content, platform || "Instagram");
        }
      }

      // Generate image if requested
      if (generateImage || contentType === "image") {
        const imageResult = await aiService.generateImage({
          prompt: topic || "beautiful landscape",
          style: imageStyle,
          aspectRatio: platform === "Instagram" ? "1:1" : "16:9",
        });
        imageUrl = imageResult.url;
      }

      // Generate video if requested
      if (generateVideo || contentType === "video") {
        const videoResult = await aiService.generateVideo({
          prompt: topic || "engaging social media video",
          style: videoStyle,
          aspectRatio: platform === "TikTok" ? "9:16" : "16:9",
        });
        videoUrl = videoResult.url;
      }
      
      res.json({ 
        content, 
        imageUrl, 
        videoUrl,
        hashtags,
        suggestions: content ? [content] : [], 
      });
    } catch (error) {
      console.error('AI generation error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate AI content" });
    }
  });

  // Get dashboard analytics - REAL DATA ONLY
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const userId = "demo-user-1";
      
      // Get REAL data from storage
      const [posts, platforms] = await Promise.all([
        storage.getPostsByUserId(userId),
        storage.getPlatformsByUserId(userId),
      ]);

      // Calculate REAL metrics from actual posts
      const publishedPosts = posts.filter(p => p.status === "published");
      const pendingPosts = posts.filter(p => p.status === "pending");
      const scheduledPosts = posts.filter(p => p.status === "scheduled");
      
      // Calculate total engagement from published posts only
      const totalEngagement = publishedPosts.reduce((sum, post) => {
        if (post.engagementData) {
          return sum + (post.engagementData.likes || 0) + 
                      (post.engagementData.comments || 0) + 
                      (post.engagementData.shares || 0);
        }
        return sum;
      }, 0);

      // Return REAL analytics data
      const dashboardData = {
        totalPosts: posts.length,
        totalEngagement: totalEngagement,
        pendingApproval: pendingPosts.length,
        scheduledPosts: scheduledPosts.length,
        metrics: {
          totalReach: publishedPosts.reduce((sum, p) => sum + (p.engagementData?.reach || 0), 0),
          engagement: totalEngagement,
          newFollowers: 0, // Real platform API would provide this
          clickRate: 0, // Real platform API would provide this
        },
        platformPerformance: [], // Empty until real platforms are connected
        engagementOverTime: [], // Empty until real data exists
        topPerformingPosts: publishedPosts
          .filter(p => p.engagementData)
          .sort((a, b) => {
            const aEngagement = (a.engagementData?.likes || 0) + (a.engagementData?.comments || 0);
            const bEngagement = (b.engagementData?.likes || 0) + (b.engagementData?.comments || 0);
            return bEngagement - aEngagement;
          })
          .slice(0, 5)
          .map(post => ({
            id: post.id,
            platform: post.platforms?.[0] || "Unknown",
            content: post.content.substring(0, 50) + "...",
            publishedAt: post.publishedAt?.toISOString() || "Unknown",
            engagement: post.engagementData || { likes: 0, comments: 0, shares: 0 },
            engagementRate: 0,
          })),
      };

      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// AI suggestion generator using real AI
async function generateAISuggestions(prompt: string): Promise<string[]> {
  try {
    const suggestions = await aiService.generateContent({
      topic: prompt,
      tone: "engaging",
      platform: "Instagram",
      includeHashtags: true,
      includeEmojis: true,
      length: "medium",
    });
    return suggestions;
  } catch (error) {
    console.error("AI suggestion generation failed:", error);
    // Fallback suggestions
    return [
      "✨ Share your story with the world! #SocialMedia #ContentCreation",
      "🚀 Elevate your brand with engaging content! #Marketing #Business",
      "💡 Connect with your audience authentically! #Engagement #Community",
    ];
  }
}
