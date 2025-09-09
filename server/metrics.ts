import type { IStorage } from "./storage";

// In-memory metrics (in production, use Prometheus or similar)
class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private timings: Map<string, number[]> = new Map();
  
  increment(metric: string, value: number = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }
  
  recordTiming(metric: string, milliseconds: number) {
    const timings = this.timings.get(metric) || [];
    timings.push(milliseconds);
    // Keep last 100 timings
    if (timings.length > 100) {
      timings.shift();
    }
    this.timings.set(metric, timings);
  }
  
  gauge(metric: string, value: number) {
    this.metrics.set(metric, value);
  }
  
  getMetrics() {
    const result: Record<string, any> = {};
    
    // Counters
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    
    // Timing statistics
    for (const [key, values] of this.timings.entries()) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        result[`${key}_p50`] = sorted[Math.floor(sorted.length * 0.5)];
        result[`${key}_p95`] = sorted[Math.floor(sorted.length * 0.95)];
        result[`${key}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }
    
    return result;
  }
  
  reset() {
    this.metrics.clear();
    this.timings.clear();
  }
}

export const metrics = new MetricsCollector();

// Middleware to track API metrics
export function trackApiMetrics(req: any, res: any, next: any) {
  const start = Date.now();
  const path = req.path;
  const method = req.method;
  
  // Track request
  metrics.increment('api_requests_total');
  metrics.increment(`api_requests_${method.toLowerCase()}_total`);
  
  // Override res.json to track response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - start;
    
    // Record timing
    metrics.recordTiming('api_request_duration_ms', duration);
    metrics.recordTiming(`api_${method.toLowerCase()}_duration_ms`, duration);
    
    // Track status codes
    const status = res.statusCode;
    metrics.increment(`api_responses_${status}_total`);
    
    if (status >= 400) {
      metrics.increment('api_errors_total');
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

// Track content generation metrics
export function trackContentGeneration(
  type: 'text' | 'image' | 'video',
  success: boolean,
  qualityScore?: number,
  platform?: string
) {
  metrics.increment(`ai_generation_${type}_total`);
  
  if (success) {
    metrics.increment(`ai_generation_${type}_success_total`);
    if (qualityScore) {
      metrics.recordTiming(`ai_quality_score_${type}`, qualityScore * 100);
    }
  } else {
    metrics.increment(`ai_generation_${type}_failed_total`);
  }
  
  if (platform) {
    metrics.increment(`ai_generation_platform_${platform}_total`);
  }
}

// Track moderation decisions
export function trackModeration(
  decision: 'allow' | 'review' | 'block',
  contentType: string
) {
  metrics.increment(`moderation_${decision}_total`);
  metrics.increment(`moderation_${contentType}_${decision}_total`);
}

// Track feedback
export function trackFeedback(
  feedback: 'thumbs_up' | 'thumbs_down',
  platform?: string
) {
  metrics.increment(`feedback_${feedback}_total`);
  
  if (platform) {
    metrics.increment(`feedback_${platform}_${feedback}_total`);
  }
}

// Create metrics endpoint
export function createMetricsRoute() {
  return async (req: any, res: any) => {
    const currentMetrics = metrics.getMetrics();
    
    // Add calculated metrics
    const totalRequests = currentMetrics.api_requests_total || 0;
    const totalErrors = currentMetrics.api_errors_total || 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    const totalGeneration = (currentMetrics.ai_generation_text_total || 0) +
                          (currentMetrics.ai_generation_image_total || 0) +
                          (currentMetrics.ai_generation_video_total || 0);
    
    const successfulGeneration = (currentMetrics.ai_generation_text_success_total || 0) +
                                (currentMetrics.ai_generation_image_success_total || 0) +
                                (currentMetrics.ai_generation_video_success_total || 0);
    
    const generationSuccessRate = totalGeneration > 0 
      ? (successfulGeneration / totalGeneration) * 100 
      : 0;
    
    const avgQualityScore = (
      (currentMetrics.ai_quality_score_text_avg || 0) +
      (currentMetrics.ai_quality_score_image_avg || 0) +
      (currentMetrics.ai_quality_score_video_avg || 0)
    ) / 3 / 100; // Convert back from percentage
    
    res.json({
      ...currentMetrics,
      calculated: {
        error_rate_percent: errorRate.toFixed(2),
        generation_success_rate_percent: generationSuccessRate.toFixed(2),
        avg_quality_score: avgQualityScore.toFixed(2),
        uptime_seconds: process.uptime(),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
  };
}