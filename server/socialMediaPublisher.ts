/**
 * Social Media Publisher - Handles posting to all supported platforms
 * Implements proper API calls, media handling, and error management
 */

import { postToXWithOAuth } from './x-oauth';
import { storage } from './storage';
import { validateContentForPlatforms, normalizePlatformName, PLATFORM_LIMITS } from './platformLimits';

export interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
  url?: string;
}

export interface PublishRequest {
  content: string;
  platforms: string[];
  mediaUrls?: string[];
  userId: string;
  postId?: string;
}

/**
 * Main publishing function - routes to appropriate platform handlers
 */
export async function publishToSocialMedia(request: PublishRequest): Promise<PublishResult[]> {
  const { content, platforms, mediaUrls = [], userId } = request;

  // Validate content against all platforms
  const validation = validateContentForPlatforms(content, platforms, mediaUrls);
  if (!validation.valid) {
    return platforms.map(platform => ({
      platform,
      success: false,
      error: validation.errors.join('; ')
    }));
  }

  const results: PublishResult[] = [];

  for (const platform of platforms) {
    try {
      const normalizedPlatform = normalizePlatformName(platform);
      let result: PublishResult;

      switch (normalizedPlatform) {
        case 'x':
          result = await publishToX(content, mediaUrls, userId);
          break;
        case 'instagram':
          result = await publishToInstagram(content, mediaUrls, userId);
          break;
        case 'facebook':
          result = await publishToFacebook(content, mediaUrls, userId);
          break;
        case 'linkedin':
          result = await publishToLinkedIn(content, mediaUrls, userId);
          break;
        case 'tiktok':
          result = await publishToTikTok(content, mediaUrls, userId);
          break;
        default:
          result = {
            platform,
            success: false,
            error: `Platform ${platform} not supported yet`
          };
      }

      results.push(result);
    } catch (error: any) {
      results.push({
        platform,
        success: false,
        error: error.message || 'Unknown error occurred'
      });
    }
  }

  return results;
}

/**
 * Publish to X (Twitter)
 */
async function publishToX(content: string, mediaUrls: string[], userId: string): Promise<PublishResult> {
  try {
    // Get user's X platform connection
    const platforms = await storage.getPlatformsByUserId(userId);
    const xPlatform = platforms.find(p =>
      p.name.toLowerCase().includes('x') ||
      p.name.toLowerCase().includes('twitter')
    );

    if (!xPlatform || !xPlatform.accessToken) {
      return {
        platform: 'X',
        success: false,
        error: 'X account not connected or missing access token'
      };
    }

    // For now, only support text posts. Media posts require additional implementation
    if (mediaUrls.length > 0) {
      return {
        platform: 'X',
        success: false,
        error: 'Media posting to X not yet implemented. Text-only posts supported.'
      };
    }

    console.log('Attempting to post to X for user:', userId, 'platform connected:', xPlatform.isConnected);

    let result = await postToXWithOAuth(xPlatform.accessToken, content);

    // If token expired, try to refresh it
    if (!result.success && result.error?.includes('401') && xPlatform.refreshToken) {
      console.log('X token expired, attempting refresh...');
      try {
        const { refreshXAccessToken } = await import('./x-oauth');
        const refreshedTokens = await refreshXAccessToken(xPlatform.refreshToken);

        // Update platform with new tokens
        await storage.updatePlatform(xPlatform.id, {
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
          metadata: {
            ...xPlatform.metadata,
            expiresAt: new Date(Date.now() + refreshedTokens.expiresIn * 1000).toISOString()
          }
        });

        // Retry the post with new token
        result = await postToXWithOAuth(refreshedTokens.accessToken, content);
        console.log('Post retry after token refresh:', result.success);
      } catch (refreshError) {
        console.error('Failed to refresh X token:', refreshError);
      }
    }

    if (result.success) {
      console.log('Successfully posted to X, tweet ID:', result.tweetId);
      return {
        platform: 'X',
        success: true,
        postId: result.tweetId,
        url: result.tweetId ? `https://x.com/i/web/status/${result.tweetId}` : undefined
      };
    } else {
      console.error('Failed to post to X:', result.error);
      return {
        platform: 'X',
        success: false,
        error: result.error || 'Failed to post to X'
      };
    }
  } catch (error: any) {
    return {
      platform: 'X',
      success: false,
      error: error.message
    };
  }
}

/**
 * Publish to Instagram
 */
async function publishToInstagram(content: string, mediaUrls: string[], userId: string): Promise<PublishResult> {
  try {
    // Get user's Instagram platform connection
    const platforms = await storage.getUserPlatforms(userId);
    const instagramPlatform = platforms.find(p =>
      p.name.toLowerCase().includes('instagram')
    );

    if (!instagramPlatform || !instagramPlatform.accessToken) {
      return {
        platform: 'Instagram',
        success: false,
        error: 'Instagram account not connected. Please connect your Instagram Business account.'
      };
    }

    // Instagram requires at least one image or video
    if (mediaUrls.length === 0) {
      return {
        platform: 'Instagram',
        success: false,
        error: 'Instagram posts require at least one image or video'
      };
    }

    // Note: This is a placeholder for Instagram Graph API implementation
    // Real implementation would require:
    // 1. Upload media to Instagram
    // 2. Create media container
    // 3. Publish the container

    return {
      platform: 'Instagram',
      success: false,
      error: 'Instagram posting implementation in progress. Please use Instagram Creator Studio for now.'
    };

  } catch (error: any) {
    return {
      platform: 'Instagram',
      success: false,
      error: error.message
    };
  }
}

/**
 * Publish to Facebook
 */
async function publishToFacebook(content: string, mediaUrls: string[], userId: string): Promise<PublishResult> {
  try {
    const platforms = await storage.getUserPlatforms(userId);
    const facebookPlatform = platforms.find(p =>
      p.name.toLowerCase().includes('facebook')
    );

    if (!facebookPlatform || !facebookPlatform.accessToken) {
      return {
        platform: 'Facebook',
        success: false,
        error: 'Facebook page not connected. Please connect your Facebook page.'
      };
    }

    // Facebook Graph API implementation would go here
    // For now, return not implemented
    return {
      platform: 'Facebook',
      success: false,
      error: 'Facebook posting implementation in progress. Please use Facebook Creator Studio for now.'
    };

  } catch (error: any) {
    return {
      platform: 'Facebook',
      success: false,
      error: error.message
    };
  }
}

/**
 * Publish to LinkedIn
 */
async function publishToLinkedIn(content: string, mediaUrls: string[], userId: string): Promise<PublishResult> {
  try {
    const platforms = await storage.getUserPlatforms(userId);
    const linkedinPlatform = platforms.find(p =>
      p.name.toLowerCase().includes('linkedin')
    );

    if (!linkedinPlatform || !linkedinPlatform.accessToken) {
      return {
        platform: 'LinkedIn',
        success: false,
        error: 'LinkedIn account not connected. Please connect your LinkedIn profile.'
      };
    }

    // LinkedIn API implementation would go here
    return {
      platform: 'LinkedIn',
      success: false,
      error: 'LinkedIn posting implementation in progress. Please use LinkedIn directly for now.'
    };

  } catch (error: any) {
    return {
      platform: 'LinkedIn',
      success: false,
      error: error.message
    };
  }
}

/**
 * Publish to TikTok
 */
async function publishToTikTok(content: string, mediaUrls: string[], userId: string): Promise<PublishResult> {
  try {
    const platforms = await storage.getUserPlatforms(userId);
    const tiktokPlatform = platforms.find(p =>
      p.name.toLowerCase().includes('tiktok')
    );

    if (!tiktokPlatform || !tiktokPlatform.accessToken) {
      return {
        platform: 'TikTok',
        success: false,
        error: 'TikTok account not connected. Please connect your TikTok account.'
      };
    }

    // TikTok requires video content
    const hasVideo = mediaUrls.some(url =>
      /\.(mp4|mov|webm)$/i.test(url)
    );

    if (!hasVideo) {
      return {
        platform: 'TikTok',
        success: false,
        error: 'TikTok posts require video content'
      };
    }

    // TikTok Content Posting API implementation would go here
    return {
      platform: 'TikTok',
      success: false,
      error: 'TikTok posting implementation in progress. Please upload videos directly to TikTok for now.'
    };

  } catch (error: any) {
    return {
      platform: 'TikTok',
      success: false,
      error: error.message
    };
  }
}

/**
 * Get posting requirements for a platform
 */
export function getPlatformPostingInfo(platform: string): {
  supported: boolean;
  requirements: string[];
  limitations: string[];
} {
  const normalizedPlatform = normalizePlatformName(platform);
  const limits = PLATFORM_LIMITS[normalizedPlatform];

  if (!limits) {
    return {
      supported: false,
      requirements: ['Platform not recognized'],
      limitations: []
    };
  }

  const requirements: string[] = [];
  const limitations: string[] = [];

  // Add requirements based on platform
  switch (normalizedPlatform) {
    case 'x':
      requirements.push('X account connected via OAuth');
      limitations.push('Text posts only (media support coming soon)');
      break;
    case 'instagram':
      requirements.push('Instagram Business account');
      requirements.push('At least one image or video');
      limitations.push('Implementation in progress');
      break;
    case 'facebook':
      requirements.push('Facebook page connected');
      limitations.push('Implementation in progress');
      break;
    case 'linkedin':
      requirements.push('LinkedIn profile connected');
      limitations.push('Implementation in progress');
      break;
    case 'tiktok':
      requirements.push('TikTok account connected');
      requirements.push('Video content required');
      limitations.push('Implementation in progress');
      break;
  }

  // Add general requirements
  requirements.push(`Content must be under ${limits.textLimit} characters`);

  if (limits.imageFormats.length > 0) {
    requirements.push(`Supported image formats: ${limits.imageFormats.join(', ')}`);
  }

  if (limits.videoFormats.length > 0) {
    requirements.push(`Supported video formats: ${limits.videoFormats.join(', ')}`);
  }

  return {
    supported: normalizedPlatform === 'x', // Only X is fully implemented
    requirements,
    limitations
  };
}