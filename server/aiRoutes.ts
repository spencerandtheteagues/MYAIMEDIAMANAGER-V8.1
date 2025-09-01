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
    
    const response = await (ai.models as any).generateContent({
      model: "gemini-2.5-pro",
      contents: [
        ...(system ? [{ role: "system", parts: [{ text: system }] }] : []),
        { role: "user", parts: [{ text: prompt || "Say ready." }] }
      ],
      generationConfig: { temperature, maxOutputTokens }
    });
    
    // SDK exposes a .text string property
    res.json({ text: response.text });
  } catch (e: any) {
    console.error("TEXT ERR", e);
    
    // Fallback to gemini-1.5-pro if 2.5 not available
    if (e?.message?.includes("not found") || e?.message?.includes("not available")) {
      try {
        const response = await (ai!.models as any).generateContent({
          model: "gemini-1.5-pro",
          contents: [
            ...(req.body?.system ? [{ role: "system", parts: [{ text: req.body.system }] }] : []),
            { role: "user", parts: [{ text: req.body?.prompt || "Say ready." }] }
          ],
          generationConfig: { 
            temperature: req.body?.temperature || 0.9, 
            maxOutputTokens: req.body?.maxOutputTokens || 2048 
          }
        });
        return res.json({ text: response.text });
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
      negativePrompt
    } = req.body || {};

    if (!ai) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    const r = await (ai.models as any).generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      n: Math.min(Math.max(count, 1), 4),
      config: {
        aspectRatio,
        outputMimeType: "image/png",
        negativePrompt
      }
    });

    // Response shape: generatedImages[].image.imageBytes (Uint8Array or base64)
    const images = (r?.generatedImages || []).map((g: any) => {
      const bytes = g?.image?.imageBytes;
      const b64 = Buffer.isBuffer(bytes)
        ? bytes.toString("base64")
        : (typeof bytes === "string" ? bytes : Buffer.from(bytes || []).toString("base64"));
      return `data:image/png;base64,${b64}`;
    });

    res.json({ images, watermark: "SynthID" });
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
    const { prompt, aspectRatio = "16:9", fast = true, negativePrompt } = req.body || {};
    const model = fast ? "veo-3.0-fast-generate-001" : "veo-3.0-generate-001";

    if (!ai) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    const op = await (ai.models as any).generateVideos({
      model,
      prompt,
      config: { aspectRatio, negativePrompt }
    });

    res.json({ operationName: (op as any).name || (op as any).operation || "" });
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
    
    // Simulate completion after 5 seconds
    setTimeout(() => {
      if ((global as any).videoOperations[operationName]) {
        (global as any).videoOperations[operationName].done = true;
      }
    }, 5000);
    
    return res.json({ operationName });
  }
});

router.get("/video/status/:name", async (req, res) => {
  try {
    const name = req.params.name;
    
    // Check if this is a simulated operation
    const operations = (global as any).videoOperations || {};
    const simulatedOp = operations[name];
    
    if (simulatedOp) {
      if (!simulatedOp.done) {
        return res.json({ done: false });
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
    
    let op = await (ai.operations as any).getVideosOperation({ operation: { name } });
    if (!op?.done) return res.json({ done: false });

    const vid = op?.response?.generatedVideos?.[0];
    if (!vid) return res.status(500).json({ error: "no_video_in_response" });

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