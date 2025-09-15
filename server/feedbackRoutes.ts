import { Router } from "express";
import type { IStorage } from "./storage";
import { InsertContentFeedback } from "@shared/schema";

export function createFeedbackRoutes(storage: IStorage) {
  const router = Router();
  
  // Submit feedback for content
  router.post("/api/feedback", async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const {
        contentId,
        contentType, // post, ai_suggestion, campaign_post
        feedback, // thumbs_up, thumbs_down
        reasons, // Array of reason codes
        qualityScore,
        platform,
        postType,
        metadata
      } = req.body;
      
      if (!contentId || !contentType || !feedback) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      if (!['thumbs_up', 'thumbs_down'].includes(feedback)) {
        return res.status(400).json({ error: "Invalid feedback type" });
      }
      
      const feedbackRecord: InsertContentFeedback = {
        userId: req.user.id,
        contentId,
        contentType,
        feedback,
        reasons: reasons || [],
        qualityScore,
        platform,
        postType,
        metadata
      };
      
      await storage.createContentFeedback(feedbackRecord);
      
      // Update brand profile preferences based on feedback
      if (feedback === 'thumbs_up' && metadata?.cta) {
        // User liked this CTA, bump its priority
        const profile = await storage.getBrandProfile(req.user.id);
        if (profile) {
          const ctas = profile.preferredCTAs || [];
          if (!ctas.includes(metadata.cta)) {
            ctas.unshift(metadata.cta); // Add to front
            await storage.updateBrandProfile(req.user.id, {
              preferredCTAs: ctas.slice(0, 10) // Keep top 10
            });
          }
        }
      }
      
      res.json({ success: true, message: "Feedback recorded" });
    } catch (error) {
      console.error("Error recording feedback:", error);
      res.status(500).json({ error: "Failed to record feedback" });
    }
  });
  
  // Get feedback statistics for user
  router.get("/api/feedback/stats", async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const feedback = await storage.getContentFeedbackByUserId(req.user.id);
      
      const stats = {
        total: feedback.length,
        thumbsUp: feedback.filter(f => f.feedback === 'thumbs_up').length,
        thumbsDown: feedback.filter(f => f.feedback === 'thumbs_down').length,
        avgQualityScore: feedback.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / (feedback.length || 1),
        topReasons: getTopReasons(feedback),
        platformBreakdown: getPlatformBreakdown(feedback)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      res.status(500).json({ error: "Failed to fetch feedback statistics" });
    }
  });
  
  return router;
}

function getTopReasons(feedback: any[]): Record<string, number> {
  const reasons: Record<string, number> = {};
  
  feedback.forEach(f => {
    if (f.reasons && Array.isArray(f.reasons)) {
      f.reasons.forEach((reason: string) => {
        reasons[reason] = (reasons[reason] || 0) + 1;
      });
    }
  });
  
  // Sort and return top 5
  return Object.fromEntries(
    Object.entries(reasons)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  );
}

function getPlatformBreakdown(feedback: any[]): Record<string, { up: number; down: number }> {
  const platforms: Record<string, { up: number; down: number }> = {};
  
  feedback.forEach(f => {
    const platform = f.platform || 'unknown';
    if (!platforms[platform]) {
      platforms[platform] = { up: 0, down: 0 };
    }
    
    if (f.feedback === 'thumbs_up') {
      platforms[platform].up++;
    } else {
      platforms[platform].down++;
    }
  });
  
  return platforms;
}