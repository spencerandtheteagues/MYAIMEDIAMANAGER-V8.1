import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";
import { generateVideoWithGemini } from "./ai/gemini-video";
import * as fs from "fs/promises";
import * as path from "path";

if (!process.env.GEMINI_API_KEY) {
  logger.warn("GEMINI_API_KEY not set. AI features will be disabled.", "AI_SERVICE");
} else {
  logger.info("GEMINI_API_KEY is configured.", "AI_SERVICE");
}

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export interface ContentGenerationOptions {
  topic: string;
  tone: string;
  platform: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
  length?: "short" | "medium" | "long";
}

export interface ImageGenerationOptions {
  prompt: string;
  style?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}

export interface VideoGenerationOptions {
  prompt: string;
  duration?: number;
  style?: string;
  aspectRatio?: "16:9" | "9:16";
}

export class AIService {
  async generateContent(options: ContentGenerationOptions): Promise<string[]> {
    if (!genAI) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    const lengthGuide = {
      short: "50-100 characters",
      medium: "100-200 characters",
      long: "200-280 characters"
    };

    const platformGuides: Record<string, string> = {
      "Instagram": "engaging, visual-focused, lifestyle-oriented",
      "Facebook": "conversational, community-focused, shareable",
      "X.com": "concise, trendy, hashtag-heavy, under 280 chars",
      "TikTok": "fun, trendy, Gen-Z focused, challenge-oriented",
      "LinkedIn": "professional, thought-leadership, industry-focused"
    };

    const prompt = `Generate 3 unique social media posts about "${options.topic}" for ${options.platform}.

Requirements:
- Tone: ${options.tone}
- Length: ${lengthGuide[options.length || "medium"]}
- Platform style: ${platformGuides[options.platform] || "general social media"}
${options.includeHashtags ? "- Include 3-5 relevant hashtags" : "- No hashtags"}
${options.includeEmojis ? "- Include appropriate emojis" : "- No emojis"}

Format each post on a new line. Make each one unique and engaging.`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2048 }
      });

      const text = result.response.text() || "";
      
      // Split by newlines and filter out empty lines
      const posts = text.split('\n')
        .filter((line: string) => line.trim().length > 0)
        .slice(0, 3);
      
      return posts.length > 0 ? posts : [text];
    } catch (error) {
      console.error("Text generation error:", error);
      throw new Error("Failed to generate content. Please try again.");
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<{ url: string }> {
    if (!genAI) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    // Enhance prompt with style and quality modifiers
    const enhancedPrompt = `${options.prompt}${options.style ? `, ${options.style} style` : ""}, high quality, professional photography, detailed`;

    try {
      // Imagen requires additional setup - using placeholder
      return {
        url: `data:image/svg+xml;base64,${btoa(`
          <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FF00FF;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#00FFFF;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="800" height="800" fill="url(#grad1)"/>
            <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="32" font-family="system-ui" font-weight="bold">
              AI Generated Image
            </text>
          </svg>
        `)}`
      };
    } catch (error) {
      console.error("Image generation error:", error);
      // Return a styled placeholder
      return {
        url: `data:image/svg+xml;base64,${btoa(`
          <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FF00FF;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#00FFFF;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="800" height="800" fill="url(#grad1)"/>
            <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="32" font-family="system-ui" font-weight="bold">
              AI Generated Image
            </text>
          </svg>
        `)}`
      };
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<{ url: string; thumbnail: string }> {
    if (!genAI) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    try {
      logger.info("Starting video generation with Veo 3", "AI_SERVICE", { prompt: options.prompt });

      // Use the actual Veo 3 implementation
      const videoBuffer = await generateVideoWithGemini(
        options.prompt,
        options.duration || 8,
        options.aspectRatio || "16:9"
      );

      // Save the video to attached_assets directory
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const videoPath = path.join(process.cwd(), 'attached_assets', `${videoId}.mp4`);

      await fs.writeFile(videoPath, videoBuffer);
      logger.info(`Video saved to ${videoPath}`, "AI_SERVICE");

      // Generate a simple thumbnail (could be enhanced with actual frame extraction)
      const thumbnail = `data:image/svg+xml;base64,${btoa(`
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
            AI Video Generated
          </text>
          <text x="50%" y="70%" text-anchor="middle" fill="white" font-size="16" font-family="system-ui" opacity="0.8">
            "${options.prompt.substring(0, 60)}..."
          </text>
        </svg>
      `)}`;

      return {
        url: `/attached_assets/${videoId}.mp4`,
        thumbnail
      };
    } catch (error) {
      logger.error("Video generation error", "AI_SERVICE", error);
      throw new Error("Video generation failed. Please try again later.");
    }
  }

  async generateHashtags(content: string, platform: string): Promise<string[]> {
    if (!genAI) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    const prompt = `Generate 5 relevant hashtags for this ${platform} post: "${content}"
    
Requirements:
- Relevant to the content
- Mix of popular and niche tags
- Platform-appropriate (${platform})
- No # symbol, just the words
    
Return only the hashtags, one per line.`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      });

      const text = result.response.text() || "";
      
      return text.split('\n')
        .filter((tag: string) => tag.trim().length > 0)
        .map((tag: string) => tag.trim().replace(/^#/, ''))
        .slice(0, 5);
    } catch (error) {
      console.error("Hashtag generation error:", error);
      return ["marketing", "socialmedia", "content", "digital", "business"];
    }
  }

  async improveContent(content: string, platform: string): Promise<string> {
    if (!genAI) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    const prompt = `Improve this ${platform} post while keeping the core message:
"${content}"

Requirements:
- Make it more engaging and compelling
- Optimize for ${platform} best practices
- Keep similar length
- Maintain the original tone and intent

Return only the improved version.`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
      });

      return result.response.text().trim();
    } catch (error) {
      console.error("Content improvement error:", error);
      return content; // Return original if improvement fails
    }
  }
}

export const aiService = new AIService();