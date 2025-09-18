import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

// In-memory store for rate limiting (could be replaced with Redis in production)
class RateLimitStore {
  private attempts: Map<string, { count: number; firstAttempt: Date; blockedUntil?: Date }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  getKey(identifier: string, ip: string): string {
    return `${identifier}:${ip}`;
  }

  increment(key: string, config: RateLimitConfig): boolean {
    const now = new Date();
    const entry = this.attempts.get(key);

    if (!entry) {
      // First attempt
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    // Check if blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return false;
    }

    // Check if window has expired
    const windowExpiry = new Date(entry.firstAttempt.getTime() + config.windowMinutes * 60000);
    if (now > windowExpiry) {
      // Reset the window
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    // Increment count
    entry.count++;

    // Check if exceeded max attempts
    if (entry.count > config.maxAttempts) {
      entry.blockedUntil = new Date(now.getTime() + config.blockDurationMinutes * 60000);
      return false;
    }

    return true;
  }

  getRemainingTime(key: string): number {
    const entry = this.attempts.get(key);
    if (!entry?.blockedUntil) return 0;

    const now = new Date();
    if (now >= entry.blockedUntil) return 0;

    return entry.blockedUntil.getTime() - now.getTime();
  }

  getAttemptCount(key: string): number {
    return this.attempts.get(key)?.count || 0;
  }

  reset(key: string) {
    this.attempts.delete(key);
  }

  cleanup() {
    const now = new Date();
    for (const [key, entry] of this.attempts.entries()) {
      // Remove entries that are no longer blocked and outside the window
      if (entry.blockedUntil && now > entry.blockedUntil) {
        const windowExpiry = new Date(entry.firstAttempt.getTime() + 24 * 60 * 60000); // Keep for 24 hours
        if (now > windowExpiry) {
          this.attempts.delete(key);
        }
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create singleton instance
const rateLimitStore = new RateLimitStore();

// Rate limiter for login attempts
export function loginRateLimiter(config: RateLimitConfig = {
  maxAttempts: 5,
  windowMinutes: 15,
  blockDurationMinutes: 30,
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body?.email || req.body?.username || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) {
      return next();
    }

    const key = rateLimitStore.getKey(email.toLowerCase(), ip);

    // Check if allowed
    if (!rateLimitStore.increment(key, config)) {
      const remainingMs = rateLimitStore.getRemainingTime(key);
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      // Log to database for security audit
      try {
        await storage.logLoginAttempt({
          usernameOrEmail: email,
          ipAddress: ip,
          success: false,
          failureReason: 'rate_limit_exceeded',
          userAgent: req.headers['user-agent'] || '',
        });
      } catch (error) {
        console.error('Failed to log rate limit violation:', error);
      }

      return res.status(429).json({
        message: `Too many login attempts. Please try again in ${remainingMinutes} minutes.`,
        retryAfter: remainingMs,
        attemptCount: rateLimitStore.getAttemptCount(key),
      });
    }

    // Add rate limit info to request for downstream use
    (req as any).rateLimitInfo = {
      key,
      attemptCount: rateLimitStore.getAttemptCount(key),
      maxAttempts: config.maxAttempts,
    };

    next();
  };
}

// Rate limiter for API endpoints
export function apiRateLimiter(config: RateLimitConfig = {
  maxAttempts: 100,
  windowMinutes: 60,
  blockDurationMinutes: 60,
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.sub;
    if (!userId) {
      return next();
    }

    const endpoint = req.path;
    const method = req.method;
    const key = `api:${userId}:${endpoint}:${method}`;

    if (!rateLimitStore.increment(key, config)) {
      const remainingMs = rateLimitStore.getRemainingTime(key);
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      return res.status(429).json({
        message: `API rate limit exceeded. Please try again in ${remainingMinutes} minutes.`,
        retryAfter: remainingMs,
      });
    }

    next();
  };
}

// Rate limiter for email sending
export function emailRateLimiter(config: RateLimitConfig = {
  maxAttempts: 3,
  windowMinutes: 60,
  blockDurationMinutes: 60,
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body?.email || req.query?.email || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email) {
      return next();
    }

    const key = `email:${email.toLowerCase()}:${ip}`;

    if (!rateLimitStore.increment(key, config)) {
      const remainingMs = rateLimitStore.getRemainingTime(key);
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      return res.status(429).json({
        message: `Too many email requests. Please try again in ${remainingMinutes} minutes.`,
        retryAfter: remainingMs,
      });
    }

    next();
  };
}

// Helper to reset rate limit for a user (e.g., after successful login)
export function resetLoginRateLimit(email: string, ip: string) {
  const key = rateLimitStore.getKey(email.toLowerCase(), ip);
  rateLimitStore.reset(key);
}

// Export the store for testing and cleanup
export { rateLimitStore };