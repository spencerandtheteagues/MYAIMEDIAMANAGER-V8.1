import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set. AI features will be disabled.");
} else {
  console.log("GEMINI_API_KEY is configured.");
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

    // Enhanced platform-specific optimization with algorithm knowledge
    const platformGuides: Record<string, any> = {
      "Instagram": {
        style: "visual storytelling, aesthetic-driven, community-focused",
        algorithm: "Prioritizes: Saves > Comments > Shares > Likes, first 30-min engagement crucial",
        hooks: ["Save this for later", "You need to see this", "Wait for it...", "POV:"],
        bestPractices: "Use all 30 hashtags, post at peak times, respond within 2 hours"
      },
      "Facebook": {
        style: "conversational, shareable, community-driven",
        algorithm: "Prioritizes: meaningful interactions, native video, Groups engagement",
        hooks: ["Can you relate?", "This made my day", "Who else...", "Thoughts?"],
        bestPractices: "Spark discussions, optimize for shares, use Facebook-specific features"
      },
      "X.com": {
        style: "concise, trendy, real-time, news-jacking potential",
        algorithm: "Prioritizes: Reply threads, quote tweets, trending topics",
        hooks: ["Thread:", "Hot take:", "Breaking:", "Unpopular opinion:"],
        bestPractices: "Thread strategically, engage with replies, use trending hashtags"
      },
      "TikTok": {
        style: "entertaining, trend-based, authentic, Gen-Z focused",
        algorithm: "Prioritizes: Watch time %, completion rate, shares, replays",
        hooks: ["Wait til the end", "POV", "Story time", "Day 1 of"],
        bestPractices: "Hook in 3 seconds, use trending sounds, post 3-5x daily"
      },
      "LinkedIn": {
        style: "professional insights, thought leadership, value-driven",
        algorithm: "Prioritizes: Dwell time, professional relevance, employee advocacy",
        hooks: ["After 10 years in [industry]", "Controversial career advice:", "I learned"],
        bestPractices: "Post Tuesday-Thursday mornings, use native video, provide value"
      }
    };

    const platform = platformGuides[options.platform] || platformGuides["Instagram"];

    // Professional-grade system prompt with expertise
    const systemPrompt = `You are an elite social media strategist with:
    - 10+ years creating viral content with 10M+ reach track record
    - Deep understanding of ${options.platform} algorithm: ${platform.algorithm}
    - Expertise in conversion-focused copywriting and brand voice consistency
    - Mastery of psychological engagement triggers (curiosity, FOMO, aspiration, belonging)
    - Data from analyzing 10,000+ successful posts

    Your content MUST:
    1. Hook readers within first 3 words using proven ${options.platform} hooks
    2. Include emotional triggers that drive engagement
    3. Use pattern interrupts every 2-3 lines to maintain attention
    4. End with clear, actionable CTAs that convert
    5. Maintain readability at 5th-8th grade level
    6. Follow ${options.platform} best practices: ${platform.bestPractices}`;

    // Enhanced user prompt with formulas for variety
    const formulas = [
      "Hook Formula: Surprising fact → Problem it reveals → Solution → Social proof → CTA",
      "Problem-Agitate-Solution: Identify problem → Agitate pain → Present solution → Benefits → CTA",
      "Before-After-Bridge: Before state → After state → Bridge (how to get there) → Proof → CTA"
    ];

    const selectedFormula = formulas[Math.floor(Math.random() * formulas.length)];
    const selectedHooks = platform.hooks.slice(0, 3).join(", ");

    const prompt = `Generate 3 unique ${options.platform} posts about "${options.topic}".

Platform Optimization:
- Style: ${platform.style}
- Best hooks to use: ${selectedHooks}
- Algorithm focus: ${platform.algorithm}

Content Requirements:
- Tone: ${options.tone} (but optimized for virality)
- Length: ${lengthGuide[options.length || "medium"]}
- Structure: Use this formula - ${selectedFormula}
${options.includeHashtags ? "- Include 3-5 niche, searchable hashtags (no generic tags)" : "- No hashtags"}
${options.includeEmojis ? "- Include strategic emojis for visual breaks and emotion" : "- No emojis"}

Psychological Triggers to Include:
- Curiosity gaps that demand resolution
- Social proof (numbers, testimonials, authority)
- Urgency or scarcity elements
- Transformation or achievement stories

Format: Write each post on a new line. Each must use a different hook and angle while maintaining consistent quality.`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95
        }
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

    // Video generation would use Veo 3 - using placeholder
    try {
      return {
        url: `data:video/mp4;base64,placeholder`,
        thumbnail: `data:image/svg+xml;base64,${btoa(`
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
              AI Video Generation
            </text>
            <text x="50%" y="70%" text-anchor="middle" fill="white" font-size="16" font-family="system-ui" opacity="0.8">
              "${options.prompt.substring(0, 60)}..."
            </text>
          </svg>
        `)}`
      };
    } catch (error) {
      console.error("Video generation error:", error);
      throw new Error("Video generation is currently in preview. Please try again later.");
    }
  }

  async generateHashtags(content: string, platform: string): Promise<string[]> {
    if (!genAI) {
      throw new Error("AI service not configured. Please set GEMINI_API_KEY.");
    }

    const hashtagStrategies: Record<string, string> = {
      "Instagram": "Mix of 5 high-volume (100k-1M posts), 5 medium (10k-100k), 5 niche (<10k) hashtags for maximum reach",
      "Facebook": "2-3 branded hashtags only, focus on community tags",
      "X.com": "1-2 trending hashtags maximum, focus on conversation",
      "TikTok": "Mix trending challenges, niche community tags, and branded hashtags",
      "LinkedIn": "3-5 professional industry hashtags, avoid overuse"
    };

    const prompt = `You are a hashtag research specialist with expertise in ${platform} growth.

Generate strategic hashtags for this post: "${content}"

Platform Strategy: ${hashtagStrategies[platform] || hashtagStrategies["Instagram"]}

Requirements:
- Research-based selection (consider search volume and competition)
- Mix of head, middle, and long-tail keywords
- Platform-specific optimization
- Industry-relevant and searchable
- No # symbol, just the words
- Avoid banned or shadowban-risk hashtags

Return exactly 5 strategic hashtags, one per line.`;

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

    const improvementStrategies: Record<string, string> = {
      "Instagram": "Add visual language, storytelling elements, save-worthy value, clear CTA",
      "Facebook": "Increase shareability, add discussion starters, community focus",
      "X.com": "Tighten copy, add wit/personality, optimize for retweets",
      "TikTok": "Add trend references, Gen-Z language, entertainment value",
      "LinkedIn": "Add data/insights, professional credibility, thought leadership"
    };

    const systemPrompt = `You are a world-class copy editor specializing in viral social media content.
Your improvements consistently increase engagement by 50-200%.`;

    const prompt = `Transform this ${platform} post into high-performing content:
"${content}"

Improvement Focus: ${improvementStrategies[platform] || improvementStrategies["Instagram"]}

Enhancement Checklist:
□ Stronger hook (first 3 words must grab attention)
□ Emotional triggers (curiosity, FOMO, aspiration, or belonging)
□ Pattern interrupts (break reading monotony every 2-3 lines)
□ Social proof or authority markers
□ Clear value proposition
□ Compelling CTA
□ Platform-specific optimization
□ Improved readability (5th-8th grade level)

Maintain: Core message, approximate length, brand voice

Return only the enhanced version (no explanations).`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topK: 30,
          topP: 0.9
        }
      });

      return result.response.text().trim();
    } catch (error) {
      console.error("Content improvement error:", error);
      return content; // Return original if improvement fails
    }
  }
}

export const aiService = new AIService();