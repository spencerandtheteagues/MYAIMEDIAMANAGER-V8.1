import { apiRequest } from "./queryClient";

export interface AiSuggestion {
  id: string;
  content: string;
  confidence: number;
  platforms: string[];
}

export interface AiContentRequest {
  prompt: string;
  platforms?: string[];
  tone?: 'friendly' | 'professional' | 'casual' | 'enthusiastic';
  contentType?: 'post' | 'caption' | 'story' | 'article';
  keywords?: string[];
  maxLength?: number;
}

export interface AiAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  engagementPrediction: number;
  suggestions: string[];
  hashtags: string[];
  bestTimeToPost?: string;
}

class AiService {
  /**
   * Generate AI content suggestions based on a prompt
   */
  async generateContent(request: AiContentRequest): Promise<AiSuggestion[]> {
    try {
      const response = await apiRequest("POST", "/api/ai/suggestions", request);
      const data = await response.json();
      
      return data.suggestions.map((content: string, index: number) => ({
        id: `suggestion-${index}`,
        content,
        confidence: Math.random() * 0.3 + 0.7, // Mock confidence between 0.7-1.0
        platforms: request.platforms || ['Instagram', 'Facebook'],
      }));
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      throw new Error('Failed to generate content suggestions');
    }
  }

  /**
   * Analyze content for engagement potential and optimization
   */
  async analyzeContent(content: string, platforms: string[]): Promise<AiAnalysisResult> {
    try {
      // This would typically be a real AI analysis endpoint
      // For now, we'll return mock analysis based on content characteristics
      
      const wordCount = content.split(' ').length;
      // Check for common emoji ranges using simpler regex
      const hasEmojis = /[\u2600-\u26FF]|[\u2700-\u27BF]/.test(content) || content.match(/:\w+:/) !== null;
      const hasHashtags = content.includes('#');
      const hasQuestions = content.includes('?');
      const hasCallToAction = /\b(visit|check|try|buy|order|book|call|contact|follow|share|like|comment)\b/i.test(content);
      
      // Calculate engagement prediction based on content features
      let engagementScore = 0.5; // Base score
      
      if (wordCount >= 10 && wordCount <= 150) engagementScore += 0.1;
      if (hasEmojis) engagementScore += 0.15;
      if (hasHashtags) engagementScore += 0.1;
      if (hasQuestions) engagementScore += 0.1;
      if (hasCallToAction) engagementScore += 0.15;
      
      // Determine sentiment
      const positiveWords = ['great', 'amazing', 'love', 'excited', 'happy', 'wonderful', 'fantastic'];
      const negativeWords = ['bad', 'terrible', 'hate', 'disappointed', 'sad', 'awful'];
      
      const lowerContent = content.toLowerCase();
      const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
      
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      else if (negativeCount > positiveCount) sentiment = 'negative';
      
      // Generate suggestions based on analysis
      const suggestions: string[] = [];
      if (!hasEmojis) suggestions.push("Consider adding emojis to make your post more engaging");
      if (!hasHashtags) suggestions.push("Add relevant hashtags to increase discoverability");
      if (wordCount > 200) suggestions.push("Consider shortening your post for better engagement");
      if (!hasCallToAction) suggestions.push("Include a call-to-action to encourage interaction");
      if (!hasQuestions) suggestions.push("Ask a question to boost comments and engagement");
      
      // Extract or suggest hashtags
      const existingHashtags = content.match(/#\w+/g) || [];
      const suggestedHashtags = this.generateHashtags(content, platforms);
      
      return {
        sentiment,
        engagementPrediction: Math.min(Math.max(engagementScore, 0), 1),
        suggestions,
        hashtags: [...existingHashtags, ...suggestedHashtags].slice(0, 10),
        bestTimeToPost: this.getBestPostingTime(platforms[0]),
      };
    } catch (error) {
      console.error('Failed to analyze content:', error);
      throw new Error('Failed to analyze content');
    }
  }

  /**
   * Generate relevant hashtags for content
   */
  private generateHashtags(content: string, platforms: string[]): string[] {
    const commonHashtags = {
      'Instagram': ['#instagood', '#photooftheday', '#love', '#instadaily', '#follow'],
      'Facebook': ['#facebook', '#social', '#community', '#share', '#connect'],
      'X (Twitter)': ['#twitter', '#trending', '#news', '#follow', '#retweet'],
      'LinkedIn': ['#linkedin', '#professional', '#business', '#networking', '#career'],
      'TikTok': ['#tiktok', '#viral', '#trending', '#fyp', '#foryou'],
    };

    // Extract keywords from content for context-aware hashtags
    const words = content.toLowerCase().split(/\s+/);
    const contentHashtags: string[] = [];
    
    // Common business/content keywords to hashtag mappings
    const keywordHashtags: { [key: string]: string[] } = {
      'coffee': ['#coffee', '#coffeelover', '#cafe', '#espresso', '#latte'],
      'food': ['#food', '#foodie', '#delicious', '#yummy', '#restaurant'],
      'business': ['#business', '#entrepreneur', '#success', '#growth', '#startup'],
      'happy': ['#happy', '#joy', '#positive', '#smile', '#good'],
      'morning': ['#morning', '#goodmorning', '#fresh', '#start', '#day'],
      'weekend': ['#weekend', '#relax', '#fun', '#enjoy', '#time'],
    };

    // Find relevant hashtags based on content
    words.forEach(word => {
      if (keywordHashtags[word]) {
        contentHashtags.push(...keywordHashtags[word].slice(0, 2));
      }
    });

    // Combine platform-specific and content-specific hashtags
    const platformHashtags = platforms[0] ? commonHashtags[platforms[0] as keyof typeof commonHashtags] || [] : [];
    
    return Array.from(new Set([...contentHashtags, ...platformHashtags])).slice(0, 5);
  }

  /**
   * Get optimal posting time for a platform
   */
  private getBestPostingTime(platform: string): string {
    const optimalTimes: { [key: string]: string } = {
      'Instagram': '11:00 AM - 1:00 PM or 7:00 PM - 9:00 PM',
      'Facebook': '1:00 PM - 3:00 PM on weekdays',
      'X (Twitter)': '9:00 AM - 10:00 AM or 7:00 PM - 9:00 PM',
      'LinkedIn': '8:00 AM - 10:00 AM or 12:00 PM - 2:00 PM on weekdays',
      'TikTok': '6:00 AM - 10:00 AM or 7:00 PM - 9:00 PM',
    };

    return optimalTimes[platform] || '12:00 PM - 2:00 PM';
  }

  /**
   * Optimize content for specific platforms
   */
  async optimizeForPlatform(content: string, platform: string): Promise<string> {
    const platformLimits: { [key: string]: number } = {
      'X (Twitter)': 280,
      'Instagram': 2200,
      'Facebook': 8000,
      'LinkedIn': 3000,
      'TikTok': 2200,
    };

    const limit = platformLimits[platform];
    if (!limit) return content;

    // If content is within limit, return as-is
    if (content.length <= limit) return content;

    // Truncate and add ellipsis if too long
    const truncated = content.substring(0, limit - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  /**
   * Generate content ideas based on trending topics
   */
  async getTrendingTopics(platforms: string[]): Promise<string[]> {
    // This would typically fetch real trending data
    // For now, return mock trending topics
    const mockTrends = [
      'Sustainable business practices',
      'Work-life balance tips',
      'Local community support',
      'Behind-the-scenes content',
      'Customer success stories',
      'Industry insights',
      'Seasonal promotions',
      'Employee spotlight',
      'Product tutorials',
      'Company milestones',
    ];

    return mockTrends.slice(0, 5);
  }
}

export const aiService = new AiService();
