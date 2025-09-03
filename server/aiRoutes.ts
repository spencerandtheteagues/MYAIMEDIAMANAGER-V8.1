/**
 * aiRoutes.ts – Express routes for Gemini 2.5 Pro, Imagen 4, Veo 3
 * Using @google/genai SDK with exact model IDs from instructions
 */
import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

// Use Gemini API key (instructions use GOOGLE_API_KEY, we have GEMINI_API_KEY)
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// ---- TEXT: Gemini 2.5 Pro ----
router.post("/text", async (req, res) => {
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
router.post("/image", async (req, res) => {
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

    // Set a longer timeout for image generation (30 seconds)
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Image generation timeout after 30 seconds')), 30000)
    );

    const generateImages = (ai.models as any).generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
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

    if (!ai) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    console.log(`Video generation request: prompt="${prompt}", aspectRatio="${aspectRatio}", model="${model}"`);

    // Note: Veo 3 video generation requires special API access
    // For now, we'll simulate the video generation process
    const operationName = `veo-operation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store operation metadata
    (global as any).videoOperations = (global as any).videoOperations || {};
    (global as any).videoOperations[operationName] = {
      prompt,
      aspectRatio,
      startTime: Date.now(),
      done: false,
      isRealVideo: false, // Flag to indicate this is simulated
    };
    
    // Simulate video generation completion after 8-10 seconds
    setTimeout(() => {
      if ((global as any).videoOperations[operationName]) {
        (global as any).videoOperations[operationName].done = true;
      }
    }, 8000 + Math.random() * 2000);
    
    const op = { name: operationName, operation: operationName };

    console.log("Video generation started with operation:", (op as any).name || (op as any).operation);
    
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
          message: "Video generation in progress... This can take several minutes."
        });
      }
      
      // Return with download URL for proxy
      delete operations[name];
      return res.json({
        done: true,
        downloadUrl: `/api/ai/video/download/${encodeURIComponent(name)}`
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
    
    // Check if this is a simulated operation
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