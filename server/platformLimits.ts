/**
 * Social Media Platform Limits and Specifications
 * Based on 2025 API requirements and research
 */

export interface PlatformLimits {
  name: string;
  textLimit: number;
  imageFormats: string[];
  videoFormats: string[];
  imageMaxSize: number; // in MB
  videoMaxSize: number; // in MB
  imageMaxDimensions: { width: number; height: number };
  videoMaxDuration: number; // in seconds
  aspectRatios: string[];
  hashtagLimit?: number;
}

export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  'x': {
    name: 'X (Twitter)',
    textLimit: 280,
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    videoFormats: ['mp4', 'mov'],
    imageMaxSize: 5, // 5MB
    videoMaxSize: 512, // 512MB
    imageMaxDimensions: { width: 1920, height: 1080 },
    videoMaxDuration: 140, // 2 minutes 20 seconds
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    hashtagLimit: 100 // characters within the 280 limit
  },
  'instagram': {
    name: 'Instagram',
    textLimit: 2200,
    imageFormats: ['jpg', 'jpeg', 'png'],
    videoFormats: ['mp4', 'mov'],
    imageMaxSize: 30, // 30MB
    videoMaxSize: 1000, // 1GB
    imageMaxDimensions: { width: 1080, height: 1350 },
    videoMaxDuration: 60, // 1 minute for feed posts
    aspectRatios: ['1:1', '4:5', '9:16'],
    hashtagLimit: 30 // hashtags
  },
  'facebook': {
    name: 'Facebook',
    textLimit: 63206, // Very high limit, but practical limit much lower
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'],
    videoFormats: ['mp4', 'mov', 'avi', '3gp', 'wmv', 'flv'],
    imageMaxSize: 4, // 4MB per image
    videoMaxSize: 10240, // 10GB
    imageMaxDimensions: { width: 2048, height: 2048 },
    videoMaxDuration: 240, // 4 minutes
    aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    hashtagLimit: 30 // practical limit
  },
  'linkedin': {
    name: 'LinkedIn',
    textLimit: 3000,
    imageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    videoFormats: ['mp4', 'mov', 'wmv', 'flv', 'asf', 'avi', 'mkv', 'webm'],
    imageMaxSize: 20, // 20MB
    videoMaxSize: 5120, // 5GB
    imageMaxDimensions: { width: 1200, height: 1200 },
    videoMaxDuration: 600, // 10 minutes
    aspectRatios: ['1.91:1', '1:1', '9:16'],
    hashtagLimit: 3 // recommended limit
  },
  'tiktok': {
    name: 'TikTok',
    textLimit: 300, // Very limited for captions
    imageFormats: ['jpg', 'jpeg', 'png'],
    videoFormats: ['mp4', 'mov', 'webm'],
    imageMaxSize: 20, // 20MB
    videoMaxSize: 287, // 287MB
    imageMaxDimensions: { width: 1080, height: 1920 },
    videoMaxDuration: 180, // 3 minutes
    aspectRatios: ['9:16'], // Strongly prefers vertical
    hashtagLimit: 100 // characters within the 300 limit
  }
};

/**
 * Get the most restrictive character limit from selected platforms
 */
export function getMinCharacterLimit(platforms: string[]): number {
  if (!platforms.length) return 280; // Default to Twitter limit

  const limits = platforms.map(platform => {
    const normalizedPlatform = platform.toLowerCase().replace(/[^a-z]/g, '');
    return PLATFORM_LIMITS[normalizedPlatform]?.textLimit || 280;
  });

  return Math.min(...limits);
}

/**
 * Validate content against platform requirements
 */
export function validateContentForPlatforms(
  content: string,
  platforms: string[],
  mediaUrls: string[] = []
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check character limit
  const minLimit = getMinCharacterLimit(platforms);
  if (content.length > minLimit) {
    const restrictivePlatform = platforms.find(platform => {
      const normalizedPlatform = platform.toLowerCase().replace(/[^a-z]/g, '');
      return PLATFORM_LIMITS[normalizedPlatform]?.textLimit === minLimit;
    });
    errors.push(`Content exceeds ${minLimit} character limit for ${restrictivePlatform || 'selected platforms'}`);
  }

  // Check media requirements for each platform
  for (const platform of platforms) {
    const normalizedPlatform = platform.toLowerCase().replace(/[^a-z]/g, '');
    const limits = PLATFORM_LIMITS[normalizedPlatform];

    if (!limits) {
      warnings.push(`Unknown platform: ${platform}`);
      continue;
    }

    // Validate media formats (basic check based on URL extensions)
    for (const mediaUrl of mediaUrls) {
      const extension = mediaUrl.split('.').pop()?.toLowerCase();
      if (!extension) continue;

      const isImage = limits.imageFormats.includes(extension);
      const isVideo = limits.videoFormats.includes(extension);

      if (!isImage && !isVideo) {
        errors.push(`Unsupported media format .${extension} for ${limits.name}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get platform-specific posting requirements
 */
export function getPlatformRequirements(platform: string): PlatformLimits | null {
  const normalizedPlatform = platform.toLowerCase().replace(/[^a-z]/g, '');
  return PLATFORM_LIMITS[normalizedPlatform] || null;
}

/**
 * Normalize platform name for API usage
 */
export function normalizePlatformName(platform: string): string {
  const normalized = platform.toLowerCase().replace(/[^a-z]/g, '');
  const mapping: Record<string, string> = {
    'twitter': 'x',
    'xcom': 'x',
    'x': 'x',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'linkedin': 'linkedin',
    'tiktok': 'tiktok'
  };
  return mapping[normalized] || normalized;
}