import { describe, it, expect, beforeEach } from '@playwright/test';
import { generateQualityContent } from '../content/quality';
import { moderateContent, checkPromptSafety, prePublishCheck } from '../content/moderation';
import { validateContent } from '../content/validators';
import { type BrandProfile } from '../content/config';

describe('Quality Content Engine Tests', () => {
  const mockBrandProfile: BrandProfile = {
    brandName: 'TestBrand',
    voice: 'professional',
    targetAudience: 'Small business owners',
    products: ['Software tools'],
    valueProps: ['Time-saving', 'Easy to use'],
    bannedPhrases: ['cheap', 'low quality'],
    requiredDisclaimers: ['Results may vary'],
    preferredCTAs: ['Learn more', 'Get started'],
    keywords: ['productivity', 'efficiency']
  };

  describe('Content Generation', () => {
    it('should generate content with required structure', async () => {
      const result = await generateQualityContent({
        platform: 'instagram',
        postType: 'promo',
        brandProfile: mockBrandProfile,
        topic: 'New feature launch',
        useTransformers: false // Skip for testing
      });

      if (result.ok) {
        expect(result.best).toHaveProperty('caption');
        expect(result.best).toHaveProperty('hashtags');
        expect(result.best).toHaveProperty('cta');
        expect(result.candidates.length).toBeGreaterThan(0);
      }
    });

    it('should respect platform constraints', async () => {
      const result = await generateQualityContent({
        platform: 'x', // Twitter has stricter limits
        postType: 'announcement',
        brandProfile: mockBrandProfile,
        topic: 'Company update'
      });

      if (result.ok) {
        const fullContent = result.best.caption + ' ' + result.best.hashtags.join(' ');
        expect(fullContent.length).toBeLessThanOrEqual(280);
      }
    });

    it('should avoid banned phrases', async () => {
      const result = await generateQualityContent({
        platform: 'facebook',
        postType: 'promo',
        brandProfile: mockBrandProfile,
        topic: 'Product sale'
      });

      if (result.ok) {
        const content = result.best.caption.toLowerCase();
        mockBrandProfile.bannedPhrases.forEach(phrase => {
          expect(content).not.toContain(phrase.toLowerCase());
        });
      }
    });
  });

  describe('Content Validation', () => {
    it('should validate content structure', () => {
      const candidate = {
        caption: 'Test caption',
        hashtags: ['#test', '#validation'],
        cta: 'Learn more',
        hook: 'Did you know?'
      };

      const result = validateContent(
        candidate,
        {
          maxChars: 500,
          maxHashtags: 10,
          allowedRatios: ['1:1'],
          readabilityMaxGrade: 12
        },
        []
      );

      expect(result.ok).toBe(true);
    });

    it('should reject too many hashtags', () => {
      const candidate = {
        caption: 'Test',
        hashtags: Array(31).fill('#hashtag'), // 31 hashtags
        cta: 'Click here'
      };

      const result = validateContent(
        candidate,
        {
          maxChars: 500,
          maxHashtags: 30,
          allowedRatios: ['1:1'],
          readabilityMaxGrade: 12
        },
        []
      );

      expect(result.ok).toBe(false);
      expect(result.reasons).toContain('too_many_hashtags');
    });

    it('should detect duplicate content', () => {
      const candidate = {
        caption: 'This is a test post',
        hashtags: ['#test'],
        cta: 'Learn more'
      };

      const priorCaptions = ['This is a test post'];

      const result = validateContent(
        candidate,
        {
          maxChars: 500,
          maxHashtags: 30,
          allowedRatios: ['1:1'],
          readabilityMaxGrade: 12
        },
        priorCaptions
      );

      expect(result.ok).toBe(false);
      expect(result.reasons).toContain('too_similar');
    });
  });

  describe('Safety Moderation', () => {
    it('should block prohibited content', async () => {
      const result = await moderateContent(
        'Buy illegal drugs now!',
        'instagram'
      );

      expect(result.decision).toBe('block');
      expect(result.reasons).toContain('prohibited_content');
    });

    it('should flag sensitive content for review', async () => {
      const result = await moderateContent(
        'Guaranteed weight loss in 7 days!',
        'facebook'
      );

      expect(result.decision).toBe('review');
      expect(result.reasons).toContain('sensitive_content');
    });

    it('should allow safe content', async () => {
      const result = await moderateContent(
        'Check out our new productivity app! It helps you manage tasks efficiently.',
        'linkedin'
      );

      expect(result.decision).toBe('allow');
    });

    it('should check prompt safety before generation', async () => {
      const result = await checkPromptSafety(
        'Create violent content',
        'text'
      );

      expect(result.decision).toBe('block');
      expect(result.coaching).toBeDefined();
    });

    it('should enforce platform hashtag limits', async () => {
      const hashtags = Array(11).fill('#tag').join(' '); // 11 hashtags for Twitter
      const result = await moderateContent(
        `Great content ${hashtags}`,
        'x'
      );

      expect(result.decision).toBe('review');
      expect(result.reasons).toContain('excessive_hashtags');
    });

    it('should require ad disclosures', async () => {
      const result = await moderateContent(
        'Check out this amazing product!',
        'instagram',
        true // isAd
      );

      expect(result.decision).toBe('review');
      expect(result.reasons).toContain('missing_disclosure');
      expect(result.safeRewrite).toContain('#ad');
    });
  });

  describe('Pre-publish Checks', () => {
    it('should perform final safety gate', async () => {
      const result = await prePublishCheck(
        'Safe content with proper formatting',
        [],
        'instagram'
      );

      expect(result.decision).toBe('allow');
    });

    it('should flag media content for review when sensitive', async () => {
      const result = await prePublishCheck(
        'Medical treatment available',
        ['image1.jpg'],
        'facebook'
      );

      expect(result.decision).toBe('review');
      expect(result.coaching).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle full content generation pipeline', async () => {
      // 1. Check prompt safety
      const promptSafety = await checkPromptSafety(
        'Create a promotional post for our app',
        'text'
      );
      expect(promptSafety.decision).not.toBe('block');

      // 2. Generate content
      const generated = await generateQualityContent({
        platform: 'instagram',
        postType: 'promo',
        brandProfile: mockBrandProfile,
        topic: 'App features'
      });

      if (generated.ok) {
        // 3. Content should already be moderated
        expect(generated.requiresReview).toBeDefined();
        
        // 4. Pre-publish check
        const publishCheck = await prePublishCheck(
          generated.best.caption,
          [],
          'instagram'
        );
        
        expect(publishCheck.decision).not.toBe('block');
      }
    });

    it('should handle content rewriting for safety', async () => {
      const unsafeContent = 'This will cure all your problems guaranteed!';
      const result = await moderateContent(unsafeContent, 'facebook');
      
      if (result.safeRewrite) {
        expect(result.safeRewrite).not.toContain('cure');
        expect(result.safeRewrite).not.toContain('guaranteed');
      }
    });
  });
});