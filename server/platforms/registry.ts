// Platform Adapter Registry
// Centralized management of all social media platform adapters

import { PlatformAdapter, PlatformType } from './types';
import { MockPlatformAdapter } from './adapters/mock';
// Import actual adapters when APIs are approved:
// import { InstagramAdapter } from './adapters/instagram';
// import { FacebookAdapter } from './adapters/facebook';
// import { TwitterAdapter } from './adapters/twitter';
// import { LinkedInAdapter } from './adapters/linkedin';
// import { TikTokAdapter } from './adapters/tiktok';

class PlatformRegistry {
  private adapters = new Map<PlatformType, PlatformAdapter>();

  constructor() {
    this.initializeAdapters();
  }

  private initializeAdapters() {
    // Register mock adapter for all platforms during development
    const mockAdapter = new MockPlatformAdapter();

    // All supported platforms use mock adapter until real APIs are approved
    const platforms: PlatformType[] = [
      'instagram',
      'facebook',
      'twitter',
      'linkedin',
      'tiktok',
      'youtube',
      'pinterest',
      'snapchat'
    ];

    platforms.forEach(platform => {
      this.adapters.set(platform, mockAdapter);
    });

    // TODO: Replace with real adapters when APIs are approved:
    // this.adapters.set('instagram', new InstagramAdapter());
    // this.adapters.set('facebook', new FacebookAdapter());
    // this.adapters.set('twitter', new TwitterAdapter());
    // this.adapters.set('linkedin', new LinkedInAdapter());
    // this.adapters.set('tiktok', new TikTokAdapter());
  }

  getAdapter(platform: PlatformType): PlatformAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`No adapter registered for platform: ${platform}`);
    }
    return adapter;
  }

  getAllPlatforms(): PlatformType[] {
    return Array.from(this.adapters.keys());
  }

  getSupportedPlatforms(): PlatformType[] {
    // Return platforms that have real implementations (not mock)
    // For now, return empty array since we're using mock adapters
    return [];
  }

  getMockPlatforms(): PlatformType[] {
    // Return platforms using mock implementation
    return Array.from(this.adapters.keys());
  }

  // Register a new platform adapter (for when APIs are approved)
  registerAdapter(platform: PlatformType, adapter: PlatformAdapter) {
    this.adapters.set(platform, adapter);
    console.log(`Registered ${platform} adapter`);
  }

  // Check if platform is supported with real API
  isSupported(platform: PlatformType): boolean {
    const adapter = this.adapters.get(platform);
    return adapter && !(adapter instanceof MockPlatformAdapter);
  }

  // Get adapter metadata
  getAdapterInfo(platform: PlatformType) {
    const adapter = this.getAdapter(platform);
    return {
      platform,
      isReal: !(adapter instanceof MockPlatformAdapter),
      limits: adapter.getPostLimits(),
      authUrl: adapter.getAuthUrl('https://example.com/callback')
    };
  }
}

// Singleton instance
export const platformRegistry = new PlatformRegistry();

// Helper functions for easy access
export function getPlatformAdapter(platform: PlatformType): PlatformAdapter {
  return platformRegistry.getAdapter(platform);
}

export function getAllSupportedPlatforms(): PlatformType[] {
  return platformRegistry.getAllPlatforms();
}

export function isPlatformSupported(platform: PlatformType): boolean {
  return platformRegistry.isSupported(platform);
}