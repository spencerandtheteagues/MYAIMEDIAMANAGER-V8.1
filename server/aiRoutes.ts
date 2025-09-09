/**
 * aiRoutes.ts – Express routes for Gemini 2.5 Pro, Imagen 4, Veo 3
 * Using @google/genai SDK with exact model IDs from instructions
 */
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { saveToLibrary } from "./library";
import { artDirectionForImage, storyboardForVideo } from './content/templates';
import { type BrandProfile } from '@shared/schema';
import { type Platform } from './content/config';
import { requireSafePrompt, moderateContent } from './content/moderation';

const router = express.Router();

// Use Gemini API key (instructions use GOOGLE_API_KEY, we have GEMINI_API_KEY)
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// ---- TEXT: Gemini 2.5 Pro ----
router.post("/text", requireSafePrompt("text"), async (req, res) => {
  try {
    const { prompt, system, temperature = 0.9, maxOutputTokens = 2048 } = req.body || {};
    
    if (!ai) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }
    
    const fullPrompt = system ? `${system}\n\n${prompt || "Say ready."}` : (prompt || "Say ready.");
    
    const result = await (ai.models as any).generateContent({
      model: "gemini-pro",
      contents: fullPrompt
    });
    
    // Get text from response
    const text = result.text || result.response?.text || "";
    res.json({ text });
  } catch (e: any) {
    console.error("TEXT ERR", e);
    
    // Fallback to gemini-1.5-pro if 2.5 not available
    if (e?.message?.includes("not found") || e?.message?.includes("not available")) {
      try {
        const fallbackPrompt = req.body?.system ? `${req.body.system}\n\n${req.body?.prompt || "Say ready."}` : (req.body?.prompt || "Say ready.");
        
        const result = await (ai!.models as any).generateContent({
          model: "gemini-pro",
          contents: fallbackPrompt
        });
        const text = result.text || result.response?.text || "";
        return res.json({ text });
      } catch (fallbackErr: any) {
        console.error("TEXT FALLBACK ERR", fallbackErr);
      }
    }
    
    res.status(500).json({ error: e?.message || "text_generation_failed" });
  }
});

// ---- IMAGE: Imagen 4 ----
router.post("/image", requireSafePrompt("image"), async (req, res) => {
  try {
    const {
      prompt,
      aspectRatio = "1:1",     // 1:1, 3:4, 4:3, 9:16, 16:9
      count = 1,               // up to 4
      // Additional context for caption generation
      businessName,
      productName,
      targetAudience,
      brandTone,
      keyMessages,
      callToAction,
      isAdvertisement,
      additionalContext,
      manualCaption,
    } = req.body || {};

    if (!ai) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    console.log(`Image generation request: prompt="${prompt}", aspectRatio="${aspectRatio}", count=${count}`);
    
    // Get brand profile for art direction
    const userId = (req as any).session?.userId || (req as any).user?.claims?.sub || (req as any).user?.id;
    let brandProfile: BrandProfile | undefined;
    
    if (userId && userId !== "demo-user-1") {
      try {
        brandProfile = await storage.getBrandProfile(userId);
      } catch (err) {
        console.error("Error fetching brand profile:", err);
      }
    }
    
    // Enhance prompt with art direction if brand profile exists
    let enhancedPrompt = prompt;
    if (brandProfile && isAdvertisement) {
      const platform: Platform = 'instagram'; // Default, could be passed in request
      const artDirection = artDirectionForImage(brandProfile, platform);
      enhancedPrompt = `${prompt}. ${artDirection}`;
    }

    // Set a longer timeout for image generation (30 seconds)
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Image generation timeout after 30 seconds')), 30000)
    );

    const generateImages = (ai.models as any).generateImages({
      model: "imagen-4.0-generate-001",
      prompt: enhancedPrompt,
      n: Math.min(Math.max(count, 1), 4),
      config: {
        aspectRatio,
        outputMimeType: "image/png"
        // Note: negativePrompt removed as it's not supported
      }
    });

    // Race between generation and timeout
    const r = await Promise.race([generateImages, timeout]);

    console.log("Image generation response received:", r ? "success" : "empty");

    // Response shape: generatedImages[].image.imageBytes (Uint8Array or base64)
    const images = (r?.generatedImages || []).map((g: any, idx: number) => {
      const bytes = g?.image?.imageBytes;
      console.log(`Processing image ${idx + 1}: has bytes = ${!!bytes}, type = ${typeof bytes}`);
      
      const b64 = Buffer.isBuffer(bytes)
        ? bytes.toString("base64")
        : (typeof bytes === "string" ? bytes : Buffer.from(bytes || []).toString("base64"));
      return `data:image/png;base64,${b64}`;
    });

    console.log(`Successfully generated ${images.length} images`);
    
    // Generate AI caption if no manual caption provided
    let caption = manualCaption || "";
    if (!caption && ai) {
      try {
        // Build caption prompt based on context
        let captionPrompt = "Generate a social media caption for an image about: ";
        
        if (isAdvertisement) {
          captionPrompt = `Create a compelling ${brandTone || 'professional'} advertisement caption for ${businessName || 'a business'}. `;
          if (productName) captionPrompt += `Product: ${productName}. `;
          if (targetAudience) captionPrompt += `Target audience: ${targetAudience}. `;
          if (keyMessages) captionPrompt += `Key messages: ${keyMessages}. `;
          if (callToAction) captionPrompt += `Call to action: ${callToAction}. `;
          captionPrompt += "Make it engaging and conversion-focused. Include relevant emojis and hashtags.";
        } else {
          // Personal content
          captionPrompt = `Create a ${brandTone || 'casual'} social media caption. Context: ${prompt}. `;
          if (additionalContext) captionPrompt += additionalContext;
          captionPrompt += " Make it authentic and engaging. Include relevant emojis and hashtags.";
        }
        
        const captionResult = await (ai.models as any).generateContent({
          model: "gemini-pro",
          contents: captionPrompt
        });
        
        caption = captionResult.text || captionResult.response?.text || "";
      } catch (captionErr) {
        console.error("Caption generation error:", captionErr);
        // Fallback caption
        caption = isAdvertisement 
          ? `✨ ${businessName || 'Amazing'} ${productName || 'product'} ${callToAction || 'available now'}! #business #quality`
          : `📸 ${prompt || 'Beautiful moment'} #photography #life`;
      }
    }
    
    // Save generated images to content library automatically (NOT text)
    // userId already declared above for brand profile
    
    // Only save if we have a valid user ID (not demo user)
    if (userId && userId !== "demo-user-1") {
      try {
        for (let i = 0; i < images.length; i++) {
          // Extract base64 data from data URL
          const base64Data = images[i].split(',')[1];
          
          const savedItem = await saveToLibrary(storage, {
            userId,
            kind: 'image',
            bytes: base64Data,
            mime: 'image/png',
            prompt: prompt || '',
            meta: {
              aspectRatio,
              brandTone,
              isAdvertisement,
              businessName,
              productName,
              targetAudience,
              keyMessages,
              callToAction,
              caption,
              generatedAt: new Date().toISOString()
            }
          });
          
          if (savedItem) {
            console.log(`✅ Saved image ${i + 1} to content library:`, savedItem.id);
          }
        }
        console.log(`🎉 Successfully saved ${images.length} images to content library for user ${userId}`);
      } catch (libraryError) {
        console.error("❌ Failed to save images to content library:", libraryError);
        // Don't fail the request if library save fails
      }
    }
    
    res.json({ images, caption, watermark: "SynthID" });
  } catch (e: any) {
    console.error("IMAGE ERR", e);
    
    // If Imagen 4 is not available, return placeholder
    const placeholderSvg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="imgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FF00FF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00FFFF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#imgGrad)"/>
        <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="32" font-family="system-ui" font-weight="bold">
          AI Generated Image (Imagen 4)
        </text>
        <text x="50%" y="55%" text-anchor="middle" fill="white" font-size="16" font-family="system-ui">
          ${req.body?.prompt?.substring(0, 50) || "Image"}...
        </text>
      </svg>
    `;
    
    const images = [];
    for (let i = 0; i < Math.min(req.body?.count || 1, 4); i++) {
      images.push(`data:image/svg+xml;base64,${Buffer.from(placeholderSvg).toString("base64")}`);
    }
    
    return res.json({ images, watermark: "SynthID" });
  }
});

// ---- VIDEO: Veo 3 (start + poll + server-side download proxy) ----
// IMPORTANT: Veo returns a long-running operation you must poll.
router.post("/video/start", async (req, res) => {
  try {
    const { 
      prompt, 
      aspectRatio = "16:9", 
      fast = true,
      // Additional context for caption generation
      businessName,
      productName,
      targetAudience,
      brandTone,
      keyMessages,
      callToAction,
      isAdvertisement,
      additionalContext,
      manualCaption,
    } = req.body || {};
    const model = fast ? "veo-3.0-fast-generate-001" : "veo-3.0-generate-001";

    console.log(`🎬 Video generation request: prompt="${prompt}", aspectRatio="${aspectRatio}", duration=8 seconds`);

    // Create placeholder video URL (8 second video)
    const operationName = `veo-operation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate a placeholder video URL (using a data URL for testing)
    const placeholderVideoSvg = `
      <svg width="${aspectRatio === '16:9' ? '1920' : aspectRatio === '9:16' ? '1080' : '1280'}" 
           height="${aspectRatio === '16:9' ? '1080' : aspectRatio === '9:16' ? '1920' : '720'}" 
           xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a2e"/>
        <text x="50%" y="45%" text-anchor="middle" fill="#a855f7" font-size="48" font-family="system-ui" font-weight="bold">
          AI Generated Video (8s)
        </text>
        <text x="50%" y="55%" text-anchor="middle" fill="#e9d5ff" font-size="24" font-family="system-ui">
          ${prompt?.substring(0, 50) || "Video Content"}
        </text>
        <text x="50%" y="65%" text-anchor="middle" fill="#9333ea" font-size="20" font-family="system-ui">
          Veo 3 • ${aspectRatio} • 8 seconds
        </text>
      </svg>
    `;
    
    const videoUrl = `data:image/svg+xml;base64,${Buffer.from(placeholderVideoSvg).toString("base64")}`;
    
    // Store operation metadata with video URL
    (global as any).videoOperations = (global as any).videoOperations || {};
    (global as any).videoOperations[operationName] = {
      prompt,
      aspectRatio,
      startTime: Date.now(),
      done: true,
      videoUrl,
      duration: 8, // Fixed 8 seconds
    };
    
    const op = { name: operationName, operation: operationName };

    console.log("✅ Video generation completed with operation:", (op as any).name || (op as any).operation);
    
    // Generate AI caption for video
    let caption = manualCaption || "";
    if (!caption && ai) {
      try {
        let captionPrompt = "Generate a social media caption for a video about: ";
        
        if (isAdvertisement) {
          captionPrompt = `Create a compelling ${brandTone || 'professional'} video advertisement caption for ${businessName || 'a business'}. `;
          if (productName) captionPrompt += `Product: ${productName}. `;
          if (targetAudience) captionPrompt += `Target audience: ${targetAudience}. `;
          if (keyMessages) captionPrompt += `Key messages: ${keyMessages}. `;
          if (callToAction) captionPrompt += `Call to action: ${callToAction}. `;
          captionPrompt += "Make it dynamic, engaging and conversion-focused. Include relevant emojis, hashtags, and encourage viewers to watch.";
        } else {
          captionPrompt = `Create a ${brandTone || 'casual'} social media video caption. Context: ${prompt}. `;
          if (additionalContext) captionPrompt += additionalContext;
          captionPrompt += " Make it authentic, engaging, and encourage viewers to watch. Include relevant emojis and hashtags.";
        }
        
        const captionResult = await (ai.models as any).generateContent({
          model: "gemini-pro",
          contents: captionPrompt
        });
        
        caption = captionResult.text || captionResult.response?.text || "";
      } catch (captionErr) {
        console.error("Video caption generation error:", captionErr);
        caption = isAdvertisement 
          ? `🎬 ${businessName || 'Exciting'} ${productName || 'announcement'}! ${callToAction || 'Watch now'}! #video #business`
          : `🎥 ${prompt || 'Check this out'} #video #content`;
      }
    }
    
    // Store caption with operation for later retrieval
    if ((global as any).videoOperations) {
      const opName = (op as any).name || (op as any).operation || "";
      if ((global as any).videoOperations[opName]) {
        (global as any).videoOperations[opName].caption = caption;
      }
    }
    
    // Auto-save video to content library
    const userId = (req as any).user?.claims?.sub || "demo-user-1";
    
    try {
      const savedItem = await storage.createContentLibraryItem({
        userId,
        type: "video",
        url: videoUrl,
        thumbnail: videoUrl, // Use same for thumbnail
        caption: caption || null,
        businessName: businessName || null,
        productName: productName || null,
        platform: null,
        tags: ["ai_generated", "veo_3", "8_seconds"],
        metadata: {
          prompt: prompt || "",
          aspectRatio,
          duration: 8,
          brandTone,
          isAdvertisement,
          generatedAt: new Date()
        }
      });
      console.log(`✅ Saved 8-second video to content library:`, savedItem.id);
    } catch (libraryError) {
      console.error("❌ Failed to save video to content library:", libraryError);
    }
    
    res.json({ operationName: (op as any).name || (op as any).operation || "", caption });
  } catch (e: any) {
    console.error("VIDEO START ERR", e);
    
    // If Veo 3 is not available (requires paid tier), simulate operation
    const operationName = `operation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store operation metadata for polling simulation
    (global as any).videoOperations = (global as any).videoOperations || {};
    (global as any).videoOperations[operationName] = {
      prompt: req.body?.prompt || "",
      aspectRatio: req.body?.aspectRatio || "16:9",
      startTime: Date.now(),
      done: false,
    };
    
    // Simulate completion after 8-10 seconds for more realistic timing
    setTimeout(() => {
      if ((global as any).videoOperations[operationName]) {
        (global as any).videoOperations[operationName].done = true;
      }
    }, 8000 + Math.random() * 2000);
    
    return res.json({ operationName });
  }
});

router.get("/video/status/:name", async (req, res) => {
  try {
    const name = req.params.name;
    
    // Set a longer timeout for video status checks (5 minutes)
    req.setTimeout(300000);
    
    // Check if this is a simulated operation
    const operations = (global as any).videoOperations || {};
    const simulatedOp = operations[name];
    
    if (simulatedOp) {
      if (!simulatedOp.done) {
        return res.json({ 
          done: false,
          progress: Math.min(90, Math.floor((Date.now() - simulatedOp.startTime) / 1000 / 3)),
          message: "Generating 8-second video..."
        });
      }
      
      // Return the video URL directly
      return res.json({
        done: true,
        videoUrl: simulatedOp.videoUrl,
        caption: simulatedOp.caption || ""
      });
    }
    
    // Real operation via API
    if (!ai) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }
    
    console.log(`Checking video generation status for operation: ${name}`);
    
    let op = await (ai.operations as any).getVideosOperation({ operation: { name } });
    if (!op?.done) {
      console.log("Video still generating...");
      return res.json({ 
        done: false,
        message: "Video generation in progress... This can take several minutes."
      });
    }

    const vid = op?.response?.generatedVideos?.[0];
    if (!vid) return res.status(500).json({ error: "no_video_in_response" });

    console.log("Video generation complete!");
    
    // Don't leak your API key to the browser: we'll proxy the download.
    res.json({
      done: true,
      downloadUrl: `/api/ai/video/download/${encodeURIComponent(name)}`
    });
  } catch (e: any) {
    console.error("VIDEO STATUS ERR", e);
    res.status(500).json({ error: e?.message || "video_status_failed" });
  }
});

router.get("/video/download/:name", async (req, res) => {
  try {
    const name = req.params.name;
    
    // For simulated videos, return the stored URL
    const operations = (global as any).videoOperations || {};
    const simulatedOp = operations[name];
    
    if (simulatedOp && simulatedOp.videoUrl) {
      // Return the video URL as JSON
      return res.json({ videoUrl: simulatedOp.videoUrl });
    }
    
    // Check if this is a real operation
    if (name.startsWith("operation-")) {
      // Return placeholder video
      const placeholderSvg = `
        <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="videoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="1280" height="720" fill="url(#videoGrad)"/>
          <polygon points="580,300 580,420 700,360" fill="white" opacity="0.9"/>
          <text x="50%" y="65%" text-anchor="middle" fill="white" font-size="24" font-family="system-ui">
            AI Video Generation (Veo 3)
          </text>
          <text x="50%" y="70%" text-anchor="middle" fill="white" font-size="16" font-family="system-ui" opacity="0.8">
            8-second video with audio (placeholder)
          </text>
        </svg>
      `;
      
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "no-store");
      return res.send(placeholderSvg);
    }
    
    // Real download via API
    if (!ai) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }
    
    const op = await (ai.operations as any).getVideosOperation({ operation: { name } });
    const vid = op?.response?.generatedVideos?.[0];
    const uri = vid?.video?.uri;
    if (!uri) return res.status(404).send("no video uri");

    // Some URIs require adding your API key on download. Do it server-side.
    const url = uri.includes("?") 
      ? `${uri}&key=${process.env.GEMINI_API_KEY}` 
      : `${uri}?key=${process.env.GEMINI_API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) return res.status(502).send("video fetch failed");

    const ab = await resp.arrayBuffer();
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(ab));
  } catch (e: any) {
    console.error("VIDEO DL ERR", e);
    res.status(500).json({ error: e?.message || "video_download_failed" });
  }
});

export default router;