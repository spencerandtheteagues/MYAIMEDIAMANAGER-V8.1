import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth';
import type { IStorage } from './storage';
import { saveToLibrary } from './library';
import { generateHighQualityPost } from './content/quality';
import { PostType } from './content/templates';
import { Platform } from './content/config';
import { BrandProfile } from '@shared/schema';
import { generateImage } from './ai/image';

const generateCampaignSchema = z.object({
  prompt: z.string().min(1, "Campaign prompt/theme is required"),
  start_date: z.string().datetime(),
  cadence: z.enum(["2_per_day_7_days"]).default("2_per_day_7_days"),
  businessName: z.string().optional(),
  productName: z.string().optional(),
  targetAudience: z.string().optional(),
  brandTone: z.string().optional(),
  keyMessages: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
});

const applyCampaignScheduleSchema = z.object({
  morningSlot: z.string().regex(/^\d{2}:\d{2}$/).default("10:00"),
  afternoonSlot: z.string().regex(/^\d{2}:\d{2}$/).default("16:00"),
  timezone: z.string().default("UTC"),
});

export function createCampaignRoutes(storage: IStorage) {
  const router = Router();

  // POST /api/campaigns/generate - Generate a campaign with 14 posts
  router.post('/api/campaigns/generate', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const params = generateCampaignSchema.parse(req.body);
      
      // Get brand profile for better content generation
      let brandProfile = await storage.getBrandProfile(userId);
      
      // If no brand profile exists, create a basic one from campaign params
      if (!brandProfile) {
        brandProfile = {
          id: 'temp',
          userId,
          brandName: params.businessName || 'Business',
          voice: (params.brandTone as any) || 'friendly',
          targetAudience: params.targetAudience || 'General audience',
          products: params.productName ? [params.productName] : [],
          valueProps: [],
          bannedPhrases: [],
          requiredDisclaimers: [],
          preferredCTAs: params.callToAction ? [params.callToAction] : ['Learn More'],
          keywords: params.keyMessages || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      
      // Create the campaign
      const campaign = await storage.createCampaign({
        userId,
        name: `Campaign: ${params.prompt}`,
        description: `Auto-generated campaign for: ${params.prompt}`,
        platform: 'multi',
        businessName: params.businessName || 'Business',
        productName: params.productName || '',
        targetAudience: params.targetAudience || 'General audience',
        campaignGoals: 'Engagement and brand awareness',
        brandTone: params.brandTone || 'professional',
        keyMessages: params.keyMessages || [],
        platforms: ['instagram', 'facebook', 'twitter'],
        visualStyle: 'modern',
        colorScheme: 'brand colors',
        callToAction: params.callToAction || 'Learn more',
        status: 'draft',
        startDate: new Date(params.start_date),
        endDate: new Date(new Date(params.start_date).getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        postsPerDay: 2,
        totalPosts: 14,
        generationProgress: 0,
      });

      // Generate 14 posts (2 per day for 7 days)
      const posts = [];
      const startDate = new Date(params.start_date);
      const morningHour = 10; // 10:00 AM
      const afternoonHour = 16; // 4:00 PM
      
      // Define varied post types for the campaign
      const postTypeRotation: PostType[] = [
        'promo', 'tutorial', 'testimonial', 'promo', 
        'faq', 'announcement', 'promo',
        'testimonial', 'tutorial', 'promo',
        'seasonal', 'faq', 'promo', 'event'
      ];
      
      const platforms: Platform[] = ['instagram', 'facebook', 'x'];
      let postIndex = 0;
      const priorCaptions: string[] = [];
      
      for (let day = 0; day < 7; day++) {
        for (let slot = 0; slot < 2; slot++) {
          const scheduledDate = new Date(startDate);
          scheduledDate.setDate(startDate.getDate() + day);
          scheduledDate.setHours(slot === 0 ? morningHour : afternoonHour, 0, 0, 0);
          
          // Rotate through post types and platforms
          const postType = postTypeRotation[postIndex % postTypeRotation.length];
          const platform = platforms[postIndex % platforms.length];
          
          // Generate high-quality content using the quality engine
          let content = '';
          let hashtags: string[] = [];
          
          try {
            const result = await generateHighQualityPost({
              platform,
              postType,
              brand: brandProfile,
              campaignTheme: params.prompt,
              product: params.productName,
              desiredTone: brandProfile.voice,
              callToAction: params.callToAction,
              priorCaptions
            });
            
            if (result.ok) {
              content = result.best.caption;
              hashtags = result.best.hashtags;
              if (result.best.cta) {
                content += `\n\n${result.best.cta}`;
              }
              priorCaptions.push(result.best.caption);
            } else {
              // Fallback content
              content = `${params.prompt} - Post ${postIndex + 1}`;
              hashtags = ['#business', '#growth'];
            }
          } catch (err) {
            console.error('Quality generation failed:', err);
            // Simple fallback
            content = `${params.prompt} - Post ${postIndex + 1}`;
            hashtags = ['#business', '#growth'];
          }
          
          // Add hashtags to content
          if (hashtags.length > 0) {
            content += '\n\n' + hashtags.join(' ');
          }
          
          // Generate and save image for the post
          let imageUrl: string | undefined;
          try {
            const imagePrompt = `Professional social media image for ${params.businessName || 'business'}: ${content.substring(0, 80)}. Style: modern, clean, engaging.`;
            const imageResult = await generateImage({
              prompt: imagePrompt,
              aspectRatio: platform === 'instagram' ? '1:1' : '16:9',
              model: 'auto'
            });
            imageUrl = imageResult.url;
            
            // Save image to content library
            if (userId && imageUrl) {
              await saveToLibrary({
                userId,
                type: 'image',
                url: imageUrl,
                meta: {
                  prompt: imagePrompt,
                  caption: content,
                  platform,
                  campaignId: campaign.id,
                  postType,
                  aspectRatio: imageResult.aspectRatio
                }
              });
            }
          } catch (imageError) {
            console.error('Image generation failed for campaign post:', imageError);
            // Continue without image
          }
          
          const post = await storage.createPost({
            userId,
            campaignId: campaign.id,
            content,
            platform,
            status: 'draft',
            scheduledFor: scheduledDate,
            aiGenerated: true,
            imageUrl,
            metadata: {
              day: day + 1,
              slot: slot + 1,
              campaignPost: true,
              postType,
              qualityGenerated: true,
              hasImage: !!imageUrl
            },
          });
          
          posts.push(post);
          postIndex++;
        }
      }
      
      // Update campaign progress
      await storage.updateCampaign(campaign.id, {
        generationProgress: 100,
        status: 'review',
      });
      
      res.json({
        campaignId: campaign.id,
        postCount: posts.length,
        campaign,
        posts,
      });
    } catch (error) {
      console.error('Generate campaign error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to generate campaign' });
    }
  });

  // PUT /api/campaigns/:id/apply-schedule - Adjust post schedules
  router.put('/api/campaigns/:id/apply-schedule', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const schedule = applyCampaignScheduleSchema.parse(req.body);
      
      // Get the campaign
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      // Verify ownership
      const user = await storage.getUser(userId);
      if (campaign.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      // Get all posts for this campaign
      const posts = await storage.getPostsByCampaignId(id);
      
      // Parse time slots
      const [morningHour, morningMinute] = schedule.morningSlot.split(':').map(Number);
      const [afternoonHour, afternoonMinute] = schedule.afternoonSlot.split(':').map(Number);
      
      // Check for overlaps with existing scheduled posts
      const updatedPosts = [];
      for (const post of posts) {
        if (post.scheduledFor) {
          const scheduledDate = new Date(post.scheduledFor);
          const metadata = post.metadata as any;
          
          if (metadata?.slot === 1) {
            // Morning slot
            scheduledDate.setHours(morningHour, morningMinute, 0, 0);
          } else if (metadata?.slot === 2) {
            // Afternoon slot
            scheduledDate.setHours(afternoonHour, afternoonMinute, 0, 0);
          }
          
          // Check for conflicts with other scheduled posts
          const conflictingPost = await storage.getScheduledPostAtTime(userId, scheduledDate);
          if (conflictingPost && conflictingPost.id !== post.id) {
            return res.status(422).json({ 
              error: 'Schedule conflict', 
              message: `Post at ${scheduledDate.toISOString()} conflicts with existing scheduled post` 
            });
          }
          
          // Update the post schedule
          await storage.updatePost(post.id, {
            scheduledFor: scheduledDate,
          });
          
          updatedPosts.push({ ...post, scheduledFor: scheduledDate });
        }
      }
      
      res.json({
        campaignId: id,
        updatedCount: updatedPosts.length,
        posts: updatedPosts,
      });
    } catch (error) {
      console.error('Apply schedule error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to apply schedule' });
    }
  });

  // GET /api/campaigns/:id/posts - Get all posts for a campaign
  router.get('/api/campaigns/:id/posts', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      
      // Get the campaign to verify access
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      // Verify access
      const user = await storage.getUser(userId);
      if (campaign.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      // Get all posts for this campaign
      const posts = await storage.getPostsByCampaignId(id);
      
      // Sort by scheduled date
      posts.sort((a, b) => {
        if (!a.scheduledFor || !b.scheduledFor) return 0;
        return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
      });
      
      res.json(posts);
    } catch (error) {
      console.error('Get campaign posts error:', error);
      res.status(500).json({ error: 'Failed to fetch campaign posts' });
    }
  });

  return router;
}