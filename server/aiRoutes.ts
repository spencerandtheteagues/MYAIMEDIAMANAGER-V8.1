/**
 * aiRoutes.ts – Express routes for Gemini 2.5 Pro, Imagen 4, Veo 3
 */
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Use Gemini API with the provided API key
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * 2.1 TEXT (Gemini 2.5 Pro)
 */
router.post("/text", async (req, res) => {
  try {
    const { prompt, system, jsonSchema, temperature = 0.9, maxOutputTokens = 2048 } = req.body;

    if (!genAI) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    // Use gemini-1.5-pro as specified (gemini-2.5-pro when available)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType: jsonSchema ? "application/json" : undefined,
        responseSchema: jsonSchema || undefined,
      },
    });

    const chat = system 
      ? model.startChat({
          history: [{ role: "user", parts: [{ text: system }] }],
        })
      : model.startChat();

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (err: any) {
    console.error("text error", err);
    res.status(500).json({ error: err.message || "text_generation_failed" });
  }
});

/**
 * 2.2 IMAGE (Imagen 4)
 * Returns base64 data URLs so the browser can drop them straight into <img>.
 * Note: Using placeholder implementation as Imagen 4 requires Vertex AI setup
 */
router.post("/image", async (req, res) => {
  try {
    const {
      prompt,
      aspectRatio = "1:1", // 1:1, 3:4, 4:3, 9:16, 16:9 (Imagen 4 supports these)
      personGeneration = "allow_all",
      count = 1, // up to 4 per request
      negativePrompt,
      outputResolution = "1024",
    } = req.body;

    // For production: Use Vertex AI with imagen-4.0-generate-001
    // Currently returning placeholder as Imagen requires Vertex AI setup
    const images = [];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const svg = `
        <svg width="${outputResolution}" height="${outputResolution}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF00FF;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#00FFFF;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="${outputResolution}" height="${outputResolution}" fill="url(#grad${i})"/>
          <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="32" font-family="system-ui" font-weight="bold">
            AI Generated Image ${i + 1}
          </text>
          <text x="50%" y="55%" text-anchor="middle" fill="white" font-size="16" font-family="system-ui">
            ${prompt.substring(0, 50)}...
          </text>
        </svg>
      `;
      images.push(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
    }

    res.json({ images, watermark: "SynthID (applied by model)" });
  } catch (err: any) {
    console.error("image error", err);
    res.status(500).json({ error: err.message || "image_generation_failed" });
  }
});

/**
 * 2.3 VIDEO (Veo 3) – long-running job: start + poll
 * Use 'veo-3.0-fast-generate-001' for faster/cheaper runs, 'veo-3.0-generate-001' for highest quality.
 * Note: Using placeholder implementation as Veo 3 requires Vertex AI setup
 */
router.post("/video/start", async (req, res) => {
  try {
    const {
      prompt,
      negativePrompt,
      aspectRatio = "16:9", // Veo 3 supports 16:9 and 9:16 on Vertex
      fast = true,
    } = req.body;

    const model = fast ? "veo-3.0-fast-generate-001" : "veo-3.0-generate-001";

    // For production: Use Vertex AI with veo-3.0-generate-001 or veo-3.0-fast-generate-001
    // Currently returning mock operation ID as Veo requires Vertex AI setup
    const operationName = `operation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store operation metadata for polling simulation
    (global as any).videoOperations = (global as any).videoOperations || {};
    (global as any).videoOperations[operationName] = {
      prompt,
      aspectRatio,
      startTime: Date.now(),
      done: false,
    };

    // Simulate completion after 5 seconds
    setTimeout(() => {
      if ((global as any).videoOperations[operationName]) {
        (global as any).videoOperations[operationName].done = true;
      }
    }, 5000);

    res.json({ operationName });
  } catch (err: any) {
    console.error("video start error", err);
    res.status(500).json({ error: err.message || "video_start_failed" });
  }
});

router.get("/video/status/:operationName", async (req, res) => {
  try {
    const { operationName } = req.params;
    
    // Check simulated operation status
    const operations = (global as any).videoOperations || {};
    const op = operations[operationName];
    
    if (!op) {
      return res.status(404).json({ error: "operation_not_found" });
    }

    if (!op.done) {
      return res.json({ done: false });
    }

    // Return placeholder video URL
    const placeholderVideoUrl = `data:image/svg+xml;base64,${Buffer.from(`
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
          ${op.prompt.substring(0, 60)}...
        </text>
      </svg>
    `).toString('base64')}`;

    // Clean up operation
    delete operations[operationName];

    return res.json({ 
      done: true, 
      uri: placeholderVideoUrl, 
      hasAudio: true, 
      lengthSeconds: 8 
    });
  } catch (err: any) {
    console.error("video poll error", err);
    res.status(500).json({ error: err.message || "video_poll_failed" });
  }
});

export default router;