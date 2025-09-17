// Mock Platform Adapter
// Simulates social media platform behavior for development and testing

import {
  PlatformAdapter,
  PlatformType,
  PlatformCredentials,
  PublishRequest,
  PublishResult,
  ValidationResult,
  PlatformLimits,
  PlatformAccount,
  PostAnalytics
} from '../types';
import { randomUUID } from 'crypto';

export class MockPlatformAdapter implements PlatformAdapter {
  platform: PlatformType = 'instagram'; // This will be overridden

  // Mock authentication URLs
  getAuthUrl(redirectUri: string, scopes?: string[]): string {
    return `https://mock-platform.com/oauth/authorize?client_id=mock&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes?.join(',') || 'read,write'}&response_type=code`;
  }

  // Mock token exchange
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<PlatformCredentials> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (code === 'error') {
      throw new Error('Invalid authorization code');
    }

    return {
      accessToken: `mock_access_token_${randomUUID()}`,
      refreshToken: `mock_refresh_token_${randomUUID()}`,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      userId: `mock_user_${randomUUID()}`,
    };
  }

  // Mock token refresh
  async refreshAccessToken(refreshToken: string): Promise<PlatformCredentials> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      accessToken: `mock_access_token_refreshed_${randomUUID()}`,
      refreshToken: `mock_refresh_token_refreshed_${randomUUID()}`,
      expiresAt: new Date(Date.now() + 3600000),
      userId: `mock_user_${randomUUID()}`,
    };
  }

  // Mock publish
  async publish(credentials: PlatformCredentials, request: PublishRequest): Promise<PublishResult> {
    // Simulate publishing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate occasional failures for testing
    const shouldFail = Math.random() < 0.1; // 10% failure rate

    if (shouldFail) {
      return {
        platform: this.platform,
        success: false,
        error: 'Mock platform temporarily unavailable',
      };
    }

    const mockPostId = `mock_post_${randomUUID()}`;

    return {
      platform: this.platform,
      success: true,
      platformPostId: mockPostId,
      platformUrl: `https://mock-platform.com/posts/${mockPostId}`,
      publishedAt: new Date(),
    };
  }

  // Mock scheduled post
  async schedulePost(credentials: PlatformCredentials, request: PublishRequest): Promise<PublishResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockPostId = `mock_scheduled_${randomUUID()}`;

    return {
      platform: this.platform,
      success: true,
      platformPostId: mockPostId,
      platformUrl: `https://mock-platform.com/scheduled/${mockPostId}`,
    };
  }

  // Mock cancel scheduled post
  async cancelScheduledPost(credentials: PlatformCredentials, postId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return true; // Always successful in mock
  }

  // Mock content validation
  async validateContent(request: PublishRequest): Promise<ValidationResult> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const errors: string[] = [];
    const warnings: string[] = [];

    // Mock validation rules
    if (request.content.length > this.getPostLimits().maxTextLength) {
      errors.push(`Content exceeds maximum length of ${this.getPostLimits().maxTextLength} characters`);
    }

    if (request.media && request.media.length > this.getPostLimits().maxMedia) {
      errors.push(`Too many media files. Maximum is ${this.getPostLimits().maxMedia}`);
    }

    if (request.content.length < 10) {
      warnings.push('Content is very short. Consider adding more details for better engagement.');
    }

    if (request.metadata?.hashtags && request.metadata.hashtags.length > 30) {
      warnings.push('Too many hashtags may reduce reach. Consider using 5-10 relevant hashtags.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: {
        recommendedHashtags: ['#SocialMedia', '#Marketing', '#Business'],
        bestPostingTimes: [
          new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow same time
        ],
      },
    };
  }

  // Mock platform limits
  getPostLimits(): PlatformLimits {
    // Return Instagram-like limits as default
    return {
      maxTextLength: 2200,
      maxMedia: 10,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      maxMediaSizeMB: 100,
      supportsScheduling: true,
      supportsHashtags: true,
      supportsMentions: true,
      supportsLocation: true,
      supportsLinkPreviews: false, // Instagram doesn't support link previews in posts
    };
  }

  // Mock account info
  async getAccountInfo(credentials: PlatformCredentials): Promise<PlatformAccount> {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      id: credentials.userId || 'mock_user_123',
      username: 'mock_user_demo',
      displayName: 'Mock User Demo Account',
      profilePicture: 'https://via.placeholder.com/150x150?text=Mock+User',
      followerCount: Math.floor(Math.random() * 10000) + 1000,
      isVerified: Math.random() < 0.1, // 10% chance of being verified
      accountType: 'business',
    };
  }

  // Mock analytics
  async getPostAnalytics(credentials: PlatformCredentials, postId: string): Promise<PostAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const impressions = Math.floor(Math.random() * 10000) + 100;
    const reach = Math.floor(impressions * 0.8);
    const likes = Math.floor(reach * 0.05);
    const comments = Math.floor(likes * 0.1);
    const shares = Math.floor(likes * 0.02);
    const clicks = Math.floor(reach * 0.02);

    return {
      impressions,
      reach,
      likes,
      comments,
      shares,
      clicks,
      engagementRate: ((likes + comments + shares) / reach) * 100,
      topPerformingHashtags: ['#business', '#marketing', '#socialmedia'],
    };
  }
}

// Platform-specific mock adapters with different limits
export class MockInstagramAdapter extends MockPlatformAdapter {
  platform: PlatformType = 'instagram';

  getPostLimits(): PlatformLimits {
    return {
      maxTextLength: 2200,
      maxMedia: 10,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      maxMediaSizeMB: 100,
      supportsScheduling: true,
      supportsHashtags: true,
      supportsMentions: true,
      supportsLocation: true,
      supportsLinkPreviews: false,
    };
  }
}

export class MockTwitterAdapter extends MockPlatformAdapter {
  platform: PlatformType = 'twitter';

  getPostLimits(): PlatformLimits {
    return {
      maxTextLength: 280,
      maxMedia: 4,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      maxMediaSizeMB: 512,
      supportsScheduling: true,
      supportsHashtags: true,
      supportsMentions: true,
      supportsLocation: false,
      supportsLinkPreviews: true,
    };
  }
}

export class MockLinkedInAdapter extends MockPlatformAdapter {
  platform: PlatformType = 'linkedin';

  getPostLimits(): PlatformLimits {
    return {
      maxTextLength: 3000,
      maxMedia: 9,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      maxMediaSizeMB: 200,
      supportsScheduling: true,
      supportsHashtags: true,
      supportsMentions: true,
      supportsLocation: false,
      supportsLinkPreviews: true,
    };
  }
}

export class MockFacebookAdapter extends MockPlatformAdapter {
  platform: PlatformType = 'facebook';

  getPostLimits(): PlatformLimits {
    return {
      maxTextLength: 63206,
      maxMedia: 30,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/mov'],
      maxMediaSizeMB: 1024,
      supportsScheduling: true,
      supportsHashtags: true,
      supportsMentions: true,
      supportsLocation: true,
      supportsLinkPreviews: true,
    };
  }
}