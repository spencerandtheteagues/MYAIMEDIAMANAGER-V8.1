// Platform Publishing Framework Types
// Ready for social media API integration

export interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId?: string;
  pageId?: string; // For Facebook pages
  accountId?: string; // For platform-specific accounts
}

export interface MediaAsset {
  url: string;
  type: 'image' | 'video' | 'gif';
  alt?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface PublishRequest {
  content: string;
  media?: MediaAsset[];
  scheduledTime?: Date;
  platforms: PlatformType[];
  metadata?: {
    hashtags?: string[];
    mentions?: string[];
    location?: {
      name: string;
      latitude?: number;
      longitude?: number;
    };
    linkPreview?: {
      url: string;
      title?: string;
      description?: string;
    };
  };
}

export interface PublishResult {
  platform: PlatformType;
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  publishedAt?: Date;
}

export interface PlatformLimits {
  maxTextLength: number;
  maxMedia: number;
  supportedMediaTypes: string[];
  maxMediaSizeMB: number;
  supportsScheduling: boolean;
  supportsHashtags: boolean;
  supportsMentions: boolean;
  supportsLocation: boolean;
  supportsLinkPreviews: boolean;
}

export type PlatformType =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'snapchat';

export interface PlatformAdapter {
  platform: PlatformType;

  // Authentication
  getAuthUrl(redirectUri: string, scopes?: string[]): string;
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<PlatformCredentials>;
  refreshAccessToken(refreshToken: string): Promise<PlatformCredentials>;

  // Publishing
  publish(credentials: PlatformCredentials, request: PublishRequest): Promise<PublishResult>;
  schedulePost(credentials: PlatformCredentials, request: PublishRequest): Promise<PublishResult>;
  cancelScheduledPost(credentials: PlatformCredentials, postId: string): Promise<boolean>;

  // Content validation
  validateContent(request: PublishRequest): Promise<ValidationResult>;
  getPostLimits(): PlatformLimits;

  // Account info
  getAccountInfo(credentials: PlatformCredentials): Promise<PlatformAccount>;

  // Analytics (for future implementation)
  getPostAnalytics?(credentials: PlatformCredentials, postId: string): Promise<PostAnalytics>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: {
    optimizedContent?: string;
    recommendedHashtags?: string[];
    bestPostingTimes?: Date[];
  };
}

export interface PlatformAccount {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  followerCount?: number;
  isVerified?: boolean;
  accountType?: 'personal' | 'business' | 'creator';
}

export interface PostAnalytics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
  topPerformingHashtags?: string[];
}

// Database models for platform connections
export interface PlatformConnection {
  id: string;
  userId: string;
  platform: PlatformType;
  accountId: string;
  accountUsername: string;
  accountDisplayName: string;
  isActive: boolean;
  credentials: PlatformCredentials; // Encrypted in storage
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledPost {
  id: string;
  userId: string;
  postId: string;
  platforms: PlatformType[];
  scheduledTime: Date;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled';
  publishResults: PublishResult[];
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}