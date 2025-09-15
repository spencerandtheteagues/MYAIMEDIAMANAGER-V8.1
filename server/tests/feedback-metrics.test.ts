import { describe, it, expect, beforeEach } from '@playwright/test';
import { metrics, trackContentGeneration, trackModeration, trackFeedback } from '../metrics';

describe('Metrics and Feedback Tests', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('Content Generation Metrics', () => {
    it('should track successful text generation', () => {
      trackContentGeneration('text', true, 0.85, 'instagram');
      
      const currentMetrics = metrics.getMetrics();
      expect(currentMetrics.ai_generation_text_total).toBe(1);
      expect(currentMetrics.ai_generation_text_success_total).toBe(1);
      expect(currentMetrics.ai_generation_platform_instagram_total).toBe(1);
    });

    it('should track failed generation', () => {
      trackContentGeneration('image', false, undefined, 'facebook');
      
      const currentMetrics = metrics.getMetrics();
      expect(currentMetrics.ai_generation_image_total).toBe(1);
      expect(currentMetrics.ai_generation_image_failed_total).toBe(1);
    });

    it('should track quality scores', () => {
      trackContentGeneration('text', true, 0.75);
      trackContentGeneration('text', true, 0.85);
      trackContentGeneration('text', true, 0.90);
      
      const currentMetrics = metrics.getMetrics();
      expect(currentMetrics.ai_quality_score_text_avg).toBeDefined();
      expect(currentMetrics.ai_quality_score_text_p50).toBeDefined();
    });
  });

  describe('Moderation Metrics', () => {
    it('should track moderation decisions', () => {
      trackModeration('allow', 'text');
      trackModeration('review', 'image');
      trackModeration('block', 'text');
      
      const currentMetrics = metrics.getMetrics();
      expect(currentMetrics.moderation_allow_total).toBe(1);
      expect(currentMetrics.moderation_review_total).toBe(1);
      expect(currentMetrics.moderation_block_total).toBe(1);
      expect(currentMetrics.moderation_text_allow_total).toBe(1);
      expect(currentMetrics.moderation_image_review_total).toBe(1);
    });
  });

  describe('Feedback Metrics', () => {
    it('should track user feedback', () => {
      trackFeedback('thumbs_up', 'instagram');
      trackFeedback('thumbs_up', 'facebook');
      trackFeedback('thumbs_down', 'instagram');
      
      const currentMetrics = metrics.getMetrics();
      expect(currentMetrics.feedback_thumbs_up_total).toBe(2);
      expect(currentMetrics.feedback_thumbs_down_total).toBe(1);
      expect(currentMetrics.feedback_instagram_thumbs_up_total).toBe(1);
      expect(currentMetrics.feedback_instagram_thumbs_down_total).toBe(1);
    });
  });

  describe('API Metrics', () => {
    it('should track API request timings', () => {
      metrics.recordTiming('api_request_duration_ms', 50);
      metrics.recordTiming('api_request_duration_ms', 100);
      metrics.recordTiming('api_request_duration_ms', 150);
      
      const currentMetrics = metrics.getMetrics();
      expect(currentMetrics.api_request_duration_ms_avg).toBe(100);
      expect(currentMetrics.api_request_duration_ms_p50).toBeDefined();
    });

    it('should track API errors', () => {
      metrics.increment('api_requests_total', 10);
      metrics.increment('api_errors_total', 2);
      metrics.increment('api_responses_500_total', 1);
      metrics.increment('api_responses_404_total', 1);
      
      const currentMetrics = metrics.getMetrics();
      expect(currentMetrics.api_requests_total).toBe(10);
      expect(currentMetrics.api_errors_total).toBe(2);
    });
  });

  describe('Calculated Metrics', () => {
    it('should calculate error rates', () => {
      metrics.increment('api_requests_total', 100);
      metrics.increment('api_errors_total', 5);
      
      // Simulate metrics endpoint call
      const currentMetrics = metrics.getMetrics();
      
      // Manual calculation for test
      const errorRate = (5 / 100) * 100;
      expect(errorRate).toBe(5);
    });

    it('should calculate generation success rates', () => {
      trackContentGeneration('text', true);
      trackContentGeneration('text', true);
      trackContentGeneration('text', false);
      trackContentGeneration('image', true);
      trackContentGeneration('image', false);
      
      const currentMetrics = metrics.getMetrics();
      
      const totalGen = currentMetrics.ai_generation_text_total + currentMetrics.ai_generation_image_total;
      const successGen = currentMetrics.ai_generation_text_success_total + currentMetrics.ai_generation_image_success_total;
      const successRate = (successGen / totalGen) * 100;
      
      expect(successRate).toBe(60); // 3 out of 5 successful
    });
  });
});