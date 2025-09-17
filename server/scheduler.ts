// Platform Publishing Scheduler
// Executes scheduled posts at their designated times

import { platformPublisher } from './platforms/publisher';

class PublishingScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval = 60000; // Check every minute

  start() {
    if (this.intervalId) {
      console.log('Publishing scheduler is already running');
      return;
    }

    console.log('Starting publishing scheduler...');
    this.intervalId = setInterval(async () => {
      try {
        await this.executeScheduledPosts();
      } catch (error) {
        console.error('Error in publishing scheduler:', error);
      }
    }, this.checkInterval);

    console.log(`Publishing scheduler started - checking every ${this.checkInterval / 1000} seconds`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Publishing scheduler stopped');
    }
  }

  private async executeScheduledPosts() {
    try {
      await platformPublisher.executeScheduledPosts();
    } catch (error) {
      console.error('Failed to execute scheduled posts:', error);
    }
  }

  // Execute manually (for testing or immediate execution)
  async executeNow() {
    console.log('Manually executing scheduled posts...');
    await this.executeScheduledPosts();
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Singleton instance
export const publishingScheduler = new PublishingScheduler();

// Auto-start scheduler in production
if (process.env.NODE_ENV === 'production') {
  publishingScheduler.start();
}

// Graceful shutdown
process.on('SIGINT', () => {
  publishingScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  publishingScheduler.stop();
  process.exit(0);
});