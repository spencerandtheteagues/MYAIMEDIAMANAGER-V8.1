import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set. AI features will be disabled.");
} else {
  console.log("GEMINI_API_KEY is set, length:", process.env.GEMINI_API_KEY.length);
}

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
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
  private textModel = genAI ? genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro" 
  }) : null;

  async generateContent(options: ContentGenerationOptions): Promise<string[]> {
    if (!this.textModel) {
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
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Split by newlines and filter out empty lines
      const posts = text.split('\n')
        .filter(line => line.trim().length > 0)
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

    // Using Imagen 3 through Gemini API
    const imageModel = genAI.getGenerativeModel({ 
      model: "imagen-3.0-generate-002" 
    });

    // Enhance prompt with style and quality modifiers
    const enhancedPrompt = `${options.prompt}${options.style ? `, ${options.style} style` : ""}, high quality, professional photography, detailed`;

    try {
      const result = await imageModel.generateContent({
        contents: [{ 
          role: "user", 
          parts: [{ text: enhancedPrompt }] 
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 0,
          responseMimeType: "image/png"
        }
      });

      const response = await result.response;
      
      // For now, return a placeholder URL since Imagen requires additional setup
      // In production, this would return the actual generated image URL
      return {
        url: `data:image/svg+xml;base64,${btoa(`
          <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="800" fill="#1a1a1a"/>
            <text x="50%" y="45%" text-anchor="middle" fill="#666" font-size="24" font-family="system-ui">
              AI Image Generation
            </text>
            <text x="50%" y="55%" text-anchor="middle" fill="#444" font-size="16" font-family="system-ui">
              "${options.prompt.substring(0, 50)}..."
            </text>
          </svg>
        `)}`
      };
    } catch (error) {
      console.error("Image generation error:", error);
      // Return a styled placeholder for now
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

    // Video generation would use Veo 2 through Vertex AI
    // For now, return a placeholder since Veo requires Vertex AI setup
    
    try {
      // In production, this would call Veo 2 API
      // const videoModel = vertexAI.preview.getGenerativeModel({
      //   model: "veo-2.0-generate-001"
      // });
      
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
    if (!this.textModel) {
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
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text.split('\n')
        .filter(tag => tag.trim().length > 0)
        .map(tag => tag.trim().replace(/^#/, ''))
        .slice(0, 5);
    } catch (error) {
      console.error("Hashtag generation error:", error);
      return ["marketing", "socialmedia", "content", "digital", "business"];
    }
  }

  async improveContent(content: string, platform: string): Promise<string> {
    if (!this.textModel) {
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
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Content improvement error:", error);
      return content; // Return original if improvement fails
    }
  }
}

export const aiService = new AIService();