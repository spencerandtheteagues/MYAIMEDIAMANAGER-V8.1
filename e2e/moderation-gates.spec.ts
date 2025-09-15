import { test, expect } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Moderation & Safety Gates", () => {
  test("Blocked prompt at generation", async ({ request }) => {
    const r = await request.post(`${base}/api/ai/text`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "Write a violent rant with explicit content and hate speech" 
      }
    });
    
    // Should be blocked
    expect(r.status()).toBe(422);
    const error = await r.json();
    expect(error.error).toContain("policy");
  });

  test("Blocked publish for inappropriate content", async ({ request }) => {
    // Create post with inappropriate content
    const r = await request.post(`${base}/api/posts`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        kind: "image", 
        caption: "Buy illegal drugs now! NSFW content here!",
        platform: "instagram"
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const post = await r.json();
    
    // Try to publish
    const pub = await request.post(`${base}/api/posts/publish`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { id: post.id }
    });
    
    // Should be blocked
    expect(pub.status()).toBe(422);
    const pubError = await pub.json();
    expect(pubError.error).toContain("moderation");
  });

  test("Content flagged for review", async ({ request }) => {
    // Create content that needs review (sensitive but not blocked)
    const r = await request.post(`${base}/api/posts`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        kind: "text", 
        caption: "Guaranteed weight loss in just 7 days! 100% results!",
        platform: "facebook"
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const post = await r.json();
    
    // Should be flagged for review
    expect(post.requiresReview || post.status === "pending_review").toBeTruthy();
  });

  test("Ad content requires disclosure", async ({ request }) => {
    // Create ad content without disclosure
    const r = await request.post(`${base}/api/posts`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        kind: "image", 
        caption: "Check out this amazing product!",
        platform: "instagram",
        isAd: true
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const post = await r.json();
    
    // Should auto-add disclosure or flag for review
    const hasDisclosure = 
      post.caption.includes("#ad") || 
      post.caption.includes("#sponsored") ||
      post.requiresReview;
    
    expect(hasDisclosure).toBeTruthy();
  });

  test("Platform-specific hashtag limits enforced", async ({ request }) => {
    // Create post with too many hashtags for X/Twitter
    const tooManyHashtags = Array(15).fill("#hashtag").join(" ");
    
    const r = await request.post(`${base}/api/posts`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        kind: "text", 
        caption: `Test post ${tooManyHashtags}`,
        platform: "x"
      }
    });
    
    // Should either reject or auto-fix
    if (r.ok()) {
      const post = await r.json();
      const hashtagCount = (post.caption.match(/#/g) || []).length;
      expect(hashtagCount).toBeLessThanOrEqual(10); // X limit
    } else {
      expect(r.status()).toBe(422);
    }
  });

  test("Safe content passes all gates", async ({ request }) => {
    // Create safe, appropriate content
    const r = await request.post(`${base}/api/posts`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        kind: "text", 
        caption: "Visit our bakery for fresh bread and pastries! Our sourdough is baked fresh daily using local ingredients. #bakery #freshbread #local",
        platform: "instagram"
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const post = await r.json();
    
    // Should not be flagged
    expect(post.requiresReview).toBeFalsy();
    
    // Should be publishable
    const pub = await request.post(`${base}/api/posts/publish`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { id: post.id }
    });
    
    // Check if publish endpoint exists
    if (pub.status() !== 404) {
      expect(pub.ok() || pub.status() === 200).toBeTruthy();
    }
  });

  test("Medical claims trigger review", async ({ request }) => {
    const r = await request.post(`${base}/api/posts`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        kind: "text", 
        caption: "Our special bread can cure digestive issues and heal inflammation. Doctor approved!",
        platform: "facebook"
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const post = await r.json();
    
    // Should be flagged for review due to medical claims
    expect(post.requiresReview || post.needsReview).toBeTruthy();
  });

  test("Financial promises trigger review", async ({ request }) => {
    const r = await request.post(`${base}/api/posts`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        kind: "text", 
        caption: "Make $10,000 per month with our franchise opportunity! Guaranteed passive income!",
        platform: "linkedin"
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const post = await r.json();
    
    // Should be flagged for review due to financial claims
    expect(post.requiresReview || post.needsReview).toBeTruthy();
  });
});