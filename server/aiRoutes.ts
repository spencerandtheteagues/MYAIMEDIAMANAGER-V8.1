import express from "express";
import { withTrialGuard, consumeTrialIfEligible } from "./middleware/trial";
import { requireSafePrompt } from "./content/moderation";
import { requireCredits, deductCredits } from "./middleware/credits";
import { generateText, generateImage, startVideo, pollVideo, generateVideo } from "./ai";
import { saveToLibrary } from "./library";
import { storage } from "./storage";

const router = express.Router();

// Store video operations in memory (in production, use database)
const videoOperations = new Map<string, { videoUrl?: string; status: string; error?: string }>();

// Helper function to get user ID from request regardless of auth method
function getUserId(req: any): string | null {
  // Check session-based auth first
  if (req.session?.userId) {
    return req.session.userId;
  }
  // Check if user object has id directly (from session auth middleware)
  if (req.user?.id) {
    return req.user.id;
  }
  // Check Replit auth claims
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  // Check headers as fallback
  if (req.headers['x-user-id']) {
    return req.headers['x-user-id'] as string;
  }
  return null;
}

// Text generation with trial support
router.post("/text",
  withTrialGuard("text"),
  requireSafePrompt("text"),
  requireCredits("text"),
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { prompt, system, temperature, maxOutputTokens, platform, saveToLibrary: shouldSave } = req.body;
      
      // Generate text
      const result = await generateText({ 
        prompt, 
        system, 
        temperature,
        maxOutputTokens 
      });
      
      // Save to library if requested and user is authenticated
      if (shouldSave && userId && result.text) {
        await saveToLibrary({
          userId,
          type: 'text' as any, // We'll treat text as a special type
          url: '', // No URL for text
          meta: {
            content: result.text,
            prompt,
            platform,
            model: result.model,
            type: 'caption',
            createdAt: new Date().toISOString()
          }
        });
      }
      
      // Consume trial or credits
      await consumeTrialIfEligible(req, res);
      await deductCredits(res);
      
      res.json({
        success: true,
        text: result.text,
        model: result.model,
        usage: result.usage,
        savedToLibrary: shouldSave && userId ? true : false
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

// Image generation with trial support and caption
router.post("/image",
  withTrialGuard("image"),
  requireSafePrompt("image"),
  requireCredits("image"),
  async (req, res) => {
    try {
      const userId = getUserId(req);
      const { 
        prompt, 
        aspectRatio, 
        platform,
        businessName,
        productName,
        brandTone,
        callToAction,
        captionStyle,
        model
      } = req.body;
      
      // Enhanced prompt construction prioritizing subject matter
      let enhancedPrompt = prompt;
      
      // If no explicit prompt provided, construct one prioritizing subject matter
      if (!prompt || prompt.includes('Photoreal')) {
        const subjectMatter = req.body.productName || '';
        const businessName = req.body.businessName || '';
        const visualStyle = req.body.visualStyle || 'modern';
        const environment = req.body.environment || '';
        const mood = req.body.mood || '';
        
        if (subjectMatter.trim()) {
          // Subject matter gets priority
          enhancedPrompt = `${subjectMatter} in ${visualStyle} ${environment || 'setting'}, ${mood || 'bright'} mood`;
          
          // Add business context as secondary
          if (businessName.trim()) {
            enhancedPrompt += `, featuring ${businessName} branding`;
          }
          
          enhancedPrompt += ', photoreal, professional quality';
        } else if (businessName.trim()) {
          // Fallback when only business name is provided
          enhancedPrompt = `${businessName} ${visualStyle} ${environment || 'studio'} ${mood || 'bright'}, photoreal`;
        }
      }
      
      // Generate image with business context for enhanced generation
      const result = await generateImage({ 
        prompt: enhancedPrompt, 
        aspectRatio,
        model: model || 'auto', // Support model selection (gemini, openai, auto)
        businessContext: {
          businessName,
          productName,
          brandTone,
          callToAction,
          captionStyle,
          targetAudience: req.body.targetAudience,
          keyMessages: req.body.keyMessages,
          isAdvertisement: req.body.isAdvertisement,
          additionalContext: req.body.additionalContext,
          subjectMatterPriority: true // Flag to indicate subject matter prioritization
        }
      });
      
      // Generate caption for the image
      let caption = "";
      if (businessName || productName) {
        try {
          const captionPrompt = `Write a ${captionStyle || 'engaging'} social media caption for an image of ${businessName || ''} ${productName || ''}. ${callToAction || ''}. Keep it under 150 characters. Be ${brandTone || 'professional'}.`;
          const captionResult = await generateText({ 
            prompt: captionPrompt,
            maxOutputTokens: 200
          });
          caption = captionResult.text || `Check out ${businessName || 'our'} ${productName || 'latest update'}! ${callToAction || ''}`;
        } catch (e) {
          // Fallback caption if generation fails
          caption = `Check out ${businessName || 'our'} ${productName || 'latest update'}! ${callToAction || ''}`;
        }
      }
      
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
            model: result.model,
            caption
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
        aspectRatio: result.aspectRatio,
        caption
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
      const userId = getUserId(req);
      const { prompt, durationSeconds, platform, fast = true, model, aspectRatio } = req.body;
      
      // Enhanced prompt construction prioritizing subject matter for video
      let enhancedPrompt = prompt;
      
      // If no explicit prompt provided, construct one prioritizing subject matter
      if (!prompt || prompt.includes('Cinematic close-up')) {
        const subjectMatter = req.body.productName || '';
        const businessName = req.body.businessName || '';
        const videoStyle = req.body.videoStyle || 'professional';
        
        if (subjectMatter.trim()) {
          // Subject matter gets priority
          enhancedPrompt = `${videoStyle} cinematic close-up of ${subjectMatter} in slow motion`;
          
          // Add business context as secondary
          if (businessName.trim()) {
            enhancedPrompt += `, featuring ${businessName}`;
          }
        } else if (businessName.trim()) {
          // Fallback when only business name is provided
          enhancedPrompt = `${videoStyle} cinematic close-up of ${businessName} in slow motion`;
        }
      }
      
      // Start video generation
      const result = await startVideo({ 
        prompt: enhancedPrompt, 
        durationSeconds,
        fast 
      });
      
      // Store operation metadata with the actual video URL
      if (result.videoUrl) {
        videoOperations.set(result.operationId, {
          videoUrl: result.videoUrl,
          status: result.status || 'completed'
        });
      }
      
      // Store in library if userId exists
      if (userId && result.videoUrl) {
        await saveToLibrary({
          userId,
          type: 'video',
          url: result.videoUrl,
          meta: {
            prompt,
            duration: durationSeconds || 8,
            platform,
            aspectRatio
          }
        });
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
    const userId = getUserId(req);
    
    // Poll for video status
    const result = await pollVideo({ operationId });
    
    // If complete, auto-save to library
    if (result.status === 'completed' && result.videoUrl && userId) {
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
    const userId = getUserId(req);
    
    if (!operationId || operationId === 'undefined') {
      return res.status(400).json({ error: 'Valid operation ID required' });
    }
    
    // Check if we have stored operation data
    const storedOp = videoOperations.get(operationId);
    
    if (storedOp && storedOp.videoUrl) {
      // Return the actual video URL
      res.json({
        done: true,  // Frontend expects 'done' field
        downloadUrl: storedOp.videoUrl,  // Frontend expects 'downloadUrl'
        operationId: operationId,
        status: 'complete',
        videoUrl: storedOp.videoUrl,
        progress: 1.0
      });
    } else {
      // Operation not found or still processing
      res.json({
        done: false,
        operationId: operationId,
        status: 'processing',
        progress: 0.5
      });
    }
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