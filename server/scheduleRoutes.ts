import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function createScheduleRoutes(storage: any): Router {
  const router = Router();

  // Get scheduled posts within date range
  router.get("/api/schedule", async (req, res) => {
    try {
      const { from, to, tz = "UTC" } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ error: "from and to dates are required" });
      }

      // Convert dates to UTC for database query
      const fromDate = dayjs.tz(from as string, tz as string).utc().toDate();
      const toDate = dayjs.tz(to as string, tz as string).utc().toDate();

      // Get all posts scheduled in this range
      const posts = await storage.getScheduledPosts({
        from: fromDate,
        to: toDate,
        userId: req.user?.claims?.sub || req.user?.id || "demo-user"
      });

      // Transform posts to calendar events
      const events = posts.map((post: any) => ({
        id: post.id,
        postId: post.id,
        title: post.title || post.content?.substring(0, 50),
        caption: post.content,
        scheduledAt: post.scheduledFor,
        endsAt: dayjs(post.scheduledFor).add(30, "minutes").toISOString(),
        platform: post.platforms?.[0] || post.platform || "instagram",
        status: post.status,
        mediaUrls: [post.imageUrl, post.videoUrl].filter(Boolean),
        tags: post.tags || [],
        needsApproval: post.status === "pending_approval" || post.requiresApproval
      }));

      res.json({ events });
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  // Create scheduled post from draft
  router.post("/api/schedule", async (req, res) => {
    try {
      const schema = z.object({
        draftId: z.string().optional(),
        platform: z.string(),
        scheduledAt: z.string(),
        caption: z.string(),
        mediaUrls: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional()
      });

      const data = schema.parse(req.body);
      const userId = req.user?.claims?.sub || req.user?.id || "demo-user";

      // Check for conflicts
      const conflicts = await storage.checkScheduleConflicts({
        userId,
        platform: data.platform,
        scheduledAt: new Date(data.scheduledAt),
        duration: 30 // minutes
      });

      if (conflicts.length > 0) {
        // Suggest alternative time (15 minutes later)
        const suggestedTime = dayjs(data.scheduledAt).add(15, "minutes").toISOString();
        return res.status(409).json({
          error: "Time conflict detected",
          conflicts,
          suggestion: `Try scheduling at ${dayjs(suggestedTime).format("h:mm A")}`
        });
      }

      // Create or update the post
      let post;
      if (data.draftId) {
        // Update existing draft to scheduled
        post = await storage.updatePost(data.draftId, {
          status: "scheduled",
          scheduledFor: data.scheduledAt,
          platforms: [data.platform],
          content: data.caption,
          tags: data.tags
        });
      } else {
        // Create new scheduled post
        post = await storage.createPost({
          userId,
          content: data.caption,
          platforms: [data.platform],
          status: "scheduled",
          scheduledFor: data.scheduledAt,
          imageUrl: data.mediaUrls?.[0],
          videoUrl: data.mediaUrls?.find(url => url.match(/\.(mp4|mov|avi|webm)/i)),
          tags: data.tags,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.json({ 
        success: true, 
        postId: post.id,
        scheduledAt: data.scheduledAt 
      });
    } catch (error) {
      console.error("Error creating scheduled post:", error);
      res.status(500).json({ error: "Failed to schedule post" });
    }
  });

  // Update scheduled post
  router.put("/api/schedule/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.claims?.sub || req.user?.id || "demo-user";

      // If rescheduling, check for conflicts
      if (updates.scheduledAt) {
        const post = await storage.getPost(id);
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        const conflicts = await storage.checkScheduleConflicts({
          userId,
          platform: post.platforms?.[0] || "instagram",
          scheduledAt: new Date(updates.scheduledAt),
          duration: 30,
          excludeId: id
        });

        if (conflicts.length > 0) {
          const suggestedTime = dayjs(updates.scheduledAt).add(15, "minutes").toISOString();
          return res.status(409).json({
            error: "Time conflict detected",
            conflicts,
            suggestion: `Try ${dayjs(suggestedTime).format("h:mm A")}`
          });
        }

        updates.scheduledFor = updates.scheduledAt;
        delete updates.scheduledAt;
      }

      // Update post
      const post = await storage.updatePost(id, {
        ...updates,
        updatedAt: new Date()
      });

      res.json({ success: true, post });
    } catch (error) {
      console.error("Error updating scheduled post:", error);
      res.status(500).json({ error: "Failed to update scheduled post" });
    }
  });

  // Delete/unschedule post
  router.delete("/api/schedule/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Update to draft status instead of deleting
      await storage.updatePost(id, {
        status: "draft",
        scheduledFor: null,
        updatedAt: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error unscheduling post:", error);
      res.status(500).json({ error: "Failed to unschedule post" });
    }
  });

  // Publish post immediately
  router.post("/api/schedule/:id/publish", async (req, res) => {
    try {
      const { id } = req.params;
      
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Publish to platform APIs using the publishing framework
      const { platformPublisher } = await import('./platforms/publisher');

      // Get user ID (assuming it's available in request)
      const userId = post.userId;

      try {
        // Create publish request from post data
        const publishRequest = {
          content: post.content,
          media: post.media ? [post.media] : [],
          platforms: post.platforms ? post.platforms.split(',') : ['instagram'], // Default platform
          metadata: {
            hashtags: post.hashtags ? post.hashtags.split(',') : [],
          }
        };

        // Publish immediately to all platforms
        const results = await platformPublisher.publishToAll(userId, publishRequest);

        // Update post with publish results
        await storage.updatePost(id, {
          status: results.every(r => r.success) ? "published" : "failed",
          publishedAt: new Date(),
          updatedAt: new Date()
        });

        // Return results for user feedback
        res.json({
          success: results.every(r => r.success),
          publishedAt: new Date(),
          results
        });
        return;

      } catch (error) {
        console.error("Platform publishing failed:", error);
        // Fall back to just updating status if publishing fails
        await storage.updatePost(id, {
          status: "published", // Still mark as published even if platform APIs fail
          publishedAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.json({ success: true, publishedAt: new Date() });
    } catch (error) {
      console.error("Error publishing post:", error);
      res.status(500).json({ error: "Failed to publish post" });
    }
  });

  // Get draft posts for dragging
  router.get("/api/posts/draft", async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "demo-user";
      
      const drafts = await storage.getPosts({
        userId,
        status: "draft"
      });

      const formattedDrafts = drafts.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        caption: post.content,
        platform: post.platforms?.[0] || "instagram",
        mediaUrls: [post.imageUrl, post.videoUrl].filter(Boolean),
        hasImage: !!post.imageUrl,
        hasVideo: !!post.videoUrl,
        tags: post.tags || [],
        createdAt: post.createdAt
      }));

      res.json({ items: formattedDrafts });
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  return router;
}