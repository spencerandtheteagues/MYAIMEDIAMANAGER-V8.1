// Platform Publisher Service
// Core publishing engine that orchestrates content delivery across platforms

import { storage } from '../storage';
import { getPlatformAdapter } from './registry';
import {
  PlatformType,
  PublishRequest,
  PublishResult,
  PlatformConnection,
  ScheduledPost,
  ValidationResult
} from './types';

export class PlatformPublisher {

  // Publish content immediately to specified platforms
  async publishToAll(
    userId: string,
    request: PublishRequest
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    // Get user's connected platforms
    const connections = await this.getUserPlatformConnections(userId);

    // Filter to requested platforms
    const targetPlatforms = request.platforms.filter(platform =>
      connections.some(conn => conn.platform === platform && conn.isActive)
    );

    if (targetPlatforms.length === 0) {
      throw new Error('No active platform connections found for the requested platforms');
    }

    // Validate content for each platform
    for (const platform of targetPlatforms) {
      const adapter = getPlatformAdapter(platform);
      const validation = await adapter.validateContent(request);

      if (!validation.valid) {
        results.push({
          platform,
          success: false,
          error: `Content validation failed: ${validation.errors.join(', ')}`
        });
        continue;
      }
    }

    // Publish to each platform
    await Promise.allSettled(
      targetPlatforms.map(async (platform) => {
        try {
          const connection = connections.find(conn => conn.platform === platform);
          if (!connection) {
            results.push({
              platform,
              success: false,
              error: 'Platform connection not found'
            });
            return;
          }

          const adapter = getPlatformAdapter(platform);
          const result = await adapter.publish(connection.credentials, request);
          results.push(result);

          // Log successful publication
          if (result.success) {
            await this.logPublication(userId, platform, result);
          }

        } catch (error: any) {
          results.push({
            platform,
            success: false,
            error: error.message || 'Unknown publishing error'
          });
        }
      })
    );

    return results;
  }

  // Schedule content for future publication
  async schedulePost(
    userId: string,
    request: PublishRequest
  ): Promise<ScheduledPost> {
    if (!request.scheduledTime) {
      throw new Error('Scheduled time is required for scheduling posts');
    }

    // Validate content for all requested platforms
    await this.validateForAllPlatforms(userId, request);

    // Create scheduled post record
    const scheduledPost = await storage.createScheduledPost({
      userId,
      postId: '', // Will be set when post is created
      platforms: request.platforms,
      scheduledTime: request.scheduledTime,
      status: 'pending',
      publishResults: [],
      retryCount: 0
    });

    // Store the publish request for later execution
    await storage.storePublishRequest(scheduledPost.id, request);

    return scheduledPost;
  }

  // Execute scheduled posts (called by cron job)
  async executeScheduledPosts(): Promise<void> {
    const now = new Date();

    // Get all pending scheduled posts that are due
    const dueSchedules = await storage.getScheduledPostsDue(now);

    for (const schedule of dueSchedules) {
      try {
        // Mark as publishing to prevent duplicate execution
        await storage.updateScheduledPost(schedule.id, {
          status: 'publishing'
        });

        // Get the stored publish request
        const publishRequest = await storage.getPublishRequest(schedule.id);
        if (!publishRequest) {
          throw new Error('Publish request not found');
        }

        // Execute the publication
        const results = await this.publishToAll(schedule.userId, publishRequest);

        // Update schedule with results
        await storage.updateScheduledPost(schedule.id, {
          status: results.every(r => r.success) ? 'published' : 'failed',
          publishResults: results
        });

      } catch (error: any) {
        console.error(`Failed to execute scheduled post ${schedule.id}:`, error);

        // Increment retry count
        const newRetryCount = schedule.retryCount + 1;
        const shouldRetry = newRetryCount < 3; // Max 3 retries

        await storage.updateScheduledPost(schedule.id, {
          status: shouldRetry ? 'pending' : 'failed',
          retryCount: newRetryCount
        });
      }
    }
  }

  // Cancel a scheduled post
  async cancelScheduledPost(userId: string, scheduleId: string): Promise<boolean> {
    const schedule = await storage.getScheduledPost(scheduleId);

    if (!schedule || schedule.userId !== userId) {
      throw new Error('Scheduled post not found');
    }

    if (schedule.status !== 'pending') {
      throw new Error('Cannot cancel non-pending scheduled post');
    }

    // Cancel on platforms that support it
    const connections = await this.getUserPlatformConnections(userId);

    for (const result of schedule.publishResults) {
      if (result.platformPostId) {
        const connection = connections.find(conn => conn.platform === result.platform);
        if (connection) {
          try {
            const adapter = getPlatformAdapter(result.platform);
            await adapter.cancelScheduledPost(connection.credentials, result.platformPostId);
          } catch (error) {
            console.error(`Failed to cancel ${result.platform} post:`, error);
          }
        }
      }
    }

    // Mark as cancelled
    await storage.updateScheduledPost(scheduleId, { status: 'cancelled' });
    return true;
  }

  // Validate content for all requested platforms
  private async validateForAllPlatforms(
    userId: string,
    request: PublishRequest
  ): Promise<ValidationResult[]> {
    const connections = await this.getUserPlatformConnections(userId);
    const results: ValidationResult[] = [];

    for (const platform of request.platforms) {
      const connection = connections.find(conn =>
        conn.platform === platform && conn.isActive
      );

      if (!connection) {
        throw new Error(`No active connection found for ${platform}`);
      }

      const adapter = getPlatformAdapter(platform);
      const validation = await adapter.validateContent(request);

      if (!validation.valid) {
        throw new Error(
          `Content validation failed for ${platform}: ${validation.errors.join(', ')}`
        );
      }

      results.push(validation);
    }

    return results;
  }

  // Get user's platform connections
  private async getUserPlatformConnections(userId: string): Promise<PlatformConnection[]> {
    return await storage.getUserPlatformConnections(userId);
  }

  // Log successful publication for analytics
  private async logPublication(
    userId: string,
    platform: PlatformType,
    result: PublishResult
  ): Promise<void> {
    await storage.logPlatformPublication({
      userId,
      platform,
      platformPostId: result.platformPostId || '',
      platformUrl: result.platformUrl || '',
      publishedAt: result.publishedAt || new Date()
    });
  }

  // Get platform connection status for user
  async getPlatformStatus(userId: string): Promise<Array<{
    platform: PlatformType;
    connected: boolean;
    accountInfo?: any;
    lastPublished?: Date;
  }>> {
    const connections = await this.getUserPlatformConnections(userId);
    const allPlatforms: PlatformType[] = [
      'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'
    ];

    return allPlatforms.map(platform => {
      const connection = connections.find(conn => conn.platform === platform);
      return {
        platform,
        connected: !!connection?.isActive,
        accountInfo: connection ? {
          username: connection.accountUsername,
          displayName: connection.accountDisplayName
        } : undefined
      };
    });
  }

  // Test platform connection
  async testConnection(userId: string, platform: PlatformType): Promise<boolean> {
    const connections = await this.getUserPlatformConnections(userId);
    const connection = connections.find(conn =>
      conn.platform === platform && conn.isActive
    );

    if (!connection) {
      return false;
    }

    try {
      const adapter = getPlatformAdapter(platform);
      await adapter.getAccountInfo(connection.credentials);
      return true;
    } catch (error) {
      console.error(`Platform connection test failed for ${platform}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const platformPublisher = new PlatformPublisher();