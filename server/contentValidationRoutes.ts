/**
 * Content Validation Routes
 * Provides real-time validation for social media posts
 */

import { Router } from "express";
import { z } from "zod";
import { validateContentForPlatforms, getMinCharacterLimit } from "./platformLimits";
import { getPlatformPostingInfo } from "./socialMediaPublisher";

export function createContentValidationRoutes(): Router {
  const router = Router();

  // Validate content against platform requirements
  router.post("/api/content/validate", async (req, res) => {
    try {
      const schema = z.object({
        content: z.string(),
        platforms: z.array(z.string()),
        mediaUrls: z.array(z.string()).optional()
      });

      const { content, platforms, mediaUrls = [] } = schema.parse(req.body);

      const validation = validateContentForPlatforms(content, platforms, mediaUrls);
      const minCharLimit = getMinCharacterLimit(platforms);

      res.json({
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        characterLimit: minCharLimit,
        characterCount: content.length,
        remainingCharacters: minCharLimit - content.length,
        platformInfo: platforms.map(platform => ({
          platform,
          ...getPlatformPostingInfo(platform)
        }))
      });
    } catch (error) {
      console.error("Error validating content:", error);
      res.status(500).json({ error: "Failed to validate content" });
    }
  });

  // Get character limit for selected platforms
  router.post("/api/content/character-limit", async (req, res) => {
    try {
      const schema = z.object({
        platforms: z.array(z.string())
      });

      const { platforms } = schema.parse(req.body);
      const limit = getMinCharacterLimit(platforms);

      res.json({
        characterLimit: limit,
        platforms: platforms.map(platform => {
          const info = getPlatformPostingInfo(platform);
          return {
            platform,
            supported: info.supported,
            individual_limit: info.requirements.find(r => r.includes('characters'))
          };
        })
      });
    } catch (error) {
      console.error("Error getting character limit:", error);
      res.status(500).json({ error: "Failed to get character limit" });
    }
  });

  // Get platform requirements
  router.get("/api/platforms/:platform/requirements", async (req, res) => {
    try {
      const { platform } = req.params;
      const info = getPlatformPostingInfo(platform);

      res.json({
        platform,
        ...info
      });
    } catch (error) {
      console.error("Error getting platform requirements:", error);
      res.status(500).json({ error: "Failed to get platform requirements" });
    }
  });

  return router;
}