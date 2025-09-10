import express from "express";
import { withTrialGuard, consumeTrialIfEligible } from "./middleware/trial";
import { requireSafePrompt } from "./content/moderation";
import { requireCredits, deductCredits } from "./middleware/credits";
import { generateText, generateImage, startVideo, pollVideo } from "./ai";
import { saveToLibrary } from "./library";
import { storage } from "./storage";

const router = express.Router();

// Text generation with trial support
router.post("/text",
  withTrialGuard("text"),
  requireSafePrompt("text"),
  requireCredits("text"),
  async (req, res) => {
    try {
      const { prompt, system, temperature, maxOutputTokens } = req.body;
      
      // Generate text
      const result = await generateText({ 
        prompt, 
        system, 
        temperature,
        maxOutputTokens 
      });
      
      // Consume trial or credits
      await consumeTrialIfEligible(req, res);
      await deductCredits(res);
      
      res.json({
        success: true,
        text: result.text,
        model: result.model,
        usage: result.usage
      });
    } catch (error: any) {
      console.error('Text generation error:', error);
      res.status(500).json({ 
        error: error.message || 'Text generation failed',
        code: error.code 
      });
    }
  }
);

// Image generation with trial support
router.post("/image",
  withTrialGuard("image"),
  requireSafePrompt("image"),
  requireCredits("image"),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.headers['x-user-id'];
      const { prompt, aspectRatio, platform } = req.body;
      
      // Generate image
      const result = await generateImage({ 
        prompt, 
        aspectRatio 
      });
      
      // Auto-save to library
      if (userId) {
        await saveToLibrary({
          userId,
          type: 'image',
          url: result.url,
          meta: {
            prompt,
            aspectRatio: result.aspectRatio,
            platform,
            model: result.model
          }
        });
      }
      
      // Consume trial or credits
      await consumeTrialIfEligible(req, res);
      await deductCredits(res);
      
      res.json({
        success: true,
        id: result.localPath,
        url: result.url,
        prompt: result.prompt,
        aspectRatio: result.aspectRatio
      });
    } catch (error: any) {
      console.error('Image generation error:', error);
      res.status(500).json({ 
        error: error.message || 'Image generation failed',
        code: error.code 
      });
    }
  }
);

// Video generation with trial support
router.post("/video/start",
  withTrialGuard("video"),
  requireSafePrompt("video"),
  requireCredits("video"),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.headers['x-user-id'];
      const { prompt, durationSeconds, platform, fast = true } = req.body;
      
      // Start video generation
      const result = await startVideo({ 
        prompt, 
        durationSeconds,
        fast 
      });
      
      // Store operation metadata for library save after completion
      if (userId) {
        // Store in memory or DB for later retrieval
        // This would be handled when polling completes
      }
      
      // Consume trial or credits
      await consumeTrialIfEligible(req, res);
      await deductCredits(res);
      
      res.json({
        success: true,
        operationName: result.operationId,  // Frontend expects 'operationName'
        operationId: result.operationId,
        status: result.status,
        estimatedCompletionTime: result.estimatedCompletionTime
      });
    } catch (error: any) {
      console.error('Video generation error:', error);
      res.status(500).json({ 
        error: error.message || 'Video generation failed',
        code: error.code 
      });
    }
  }
);

// Poll video status
router.get("/video/poll/:operationId", async (req, res) => {
  try {
    const { operationId } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];
    
    // Poll for video status
    const result = await pollVideo({ operationId });
    
    // If complete, auto-save to library
    if (result.status === 'complete' && result.videoUrl && userId) {
      await saveToLibrary({
        userId,
        type: 'video',
        url: result.videoUrl,
        meta: {
          operationId,
          duration: 8 // Default duration
        }
      });
    }
    
    res.json({
      operationId: result.operationId,
      status: result.status,
      videoUrl: result.videoUrl,
      error: result.error,
      progress: result.progress
    });
  } catch (error: any) {
    console.error('Video poll error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to poll video status',
      code: error.code 
    });
  }
});

// Video status endpoint - frontend uses this
router.get("/video/status/:operationId", async (req, res) => {
  try {
    const { operationId } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];
    
    if (!operationId || operationId === 'undefined') {
      return res.status(400).json({ error: 'Valid operation ID required' });
    }
    
    // Mock completion for now since actual Vertex integration pending
    const mockVideoUrl = `/attached_assets/generated_videos/video-${operationId}.mp4`;
    
    res.json({
      done: true,  // Frontend expects 'done' field
      downloadUrl: mockVideoUrl,  // Frontend expects 'downloadUrl'
      operationId: operationId,
      status: 'complete',
      videoUrl: mockVideoUrl,
      progress: 1.0
    });
  } catch (error: any) {
    console.error('Video status error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get video status',
      code: error.code 
    });
  }
});

// Backward compatibility - old video status endpoint
router.get("/video/status", async (req, res) => {
  try {
    const operationId = req.query.op as string;
    
    if (!operationId) {
      return res.status(400).json({ error: 'Operation ID required' });
    }
    
    const result = await pollVideo({ operationId });
    
    res.json({
      operationId: result.operationId,
      status: result.status,
      videoUrl: result.videoUrl,
      error: result.error,
      progress: result.progress
    });
  } catch (error: any) {
    console.error('Video status error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get video status',
      code: error.code 
    });
  }
});

export default router;