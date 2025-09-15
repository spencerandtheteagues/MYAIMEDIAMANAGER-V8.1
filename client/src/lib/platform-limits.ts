// Platform character limits for different social media platforms
export const PLATFORM_LIMITS = {
  "Instagram": {
    caption: 2200,
    hashtags: 30,
    displayName: "Instagram"
  },
  "Facebook": {
    caption: 63206,
    hashtags: 0, // Facebook doesn't have hashtag limits
    displayName: "Facebook"
  },
  "X (Twitter)": {
    caption: 280, // Standard limit, premium users get 4000
    hashtags: 280, // Included in character count
    displayName: "X"
  },
  "TikTok": {
    caption: 2200,
    hashtags: 100, // Included in character count
    displayName: "TikTok"
  },
  "LinkedIn": {
    caption: 3000,
    hashtags: 3000, // Included in character count
    displayName: "LinkedIn"
  }
};

// Get the minimum character limit for selected platforms
export function getMinCharacterLimit(platforms: string[]): number {
  if (platforms.length === 0) return PLATFORM_LIMITS["X (Twitter)"].caption; // Default to Twitter's limit
  
  const limits = platforms.map(platform => 
    PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS]?.caption || 280
  );
  
  return Math.min(...limits);
}

// Get platform display info
export function getPlatformInfo(platform: string) {
  return PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS] || {
    caption: 280,
    hashtags: 0,
    displayName: platform
  };
}

// Check if content exceeds platform limits
export function checkContentLimit(content: string, platforms: string[]): {
  isValid: boolean;
  limit: number;
  currentLength: number;
  exceededPlatforms: string[];
} {
  const currentLength = content.length;
  const limit = getMinCharacterLimit(platforms);
  const exceededPlatforms: string[] = [];
  
  platforms.forEach(platform => {
    const platformLimit = getPlatformInfo(platform).caption;
    if (currentLength > platformLimit) {
      exceededPlatforms.push(getPlatformInfo(platform).displayName);
    }
  });
  
  return {
    isValid: currentLength <= limit,
    limit,
    currentLength,
    exceededPlatforms
  };
}

// Format content for display (text + media structure)
export function formatPostContent(
  text: string,
  imageUrl?: string | null,
  videoUrl?: string | null
): {
  displayText: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
} {
  return {
    displayText: text,
    mediaUrl: videoUrl || imageUrl || undefined,
    mediaType: videoUrl ? 'video' : imageUrl ? 'image' : undefined
  };
}