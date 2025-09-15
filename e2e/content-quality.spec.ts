import { test, expect } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Content Quality Tests", () => {
  test.beforeEach(async ({ request }) => {
    // Ensure brand profile is set up
    await request.put(`${base}/api/brand/profile`, {
      headers: { "x-user-id": "starter-user-1" },
      data: {
        brandName: "Redbird Bakehouse",
        voice: "friendly",
        targetAudience: "local foodies and families",
        valueProps: ["fresh daily", "local ingredients", "custom cakes"],
        preferredCTAs: ["Pre-order today", "Visit us", "DM to order"]
      }
    });
  });

  test("X promo meets quality thresholds", async ({ request }) => {
    const r = await request.post(`${base}/api/content/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "x", 
        postType: "promo", 
        tone: "friendly", 
        theme: "grand opening" 
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    // Verify response structure
    expect(j.ok).toBeTruthy();
    expect(j.best).toBeDefined();
    expect(j.best.caption).toBeDefined();
    expect(j.best.hashtags).toBeDefined();
    
    // Check platform constraints
    const fullContent = j.best.caption + " " + j.best.hashtags.join(" ");
    expect(fullContent.length).toBeLessThanOrEqual(280); // X character limit
    
    // Check hashtag count
    expect(j.best.hashtags.length).toBeGreaterThanOrEqual(3);
    expect(j.best.hashtags.length).toBeLessThanOrEqual(5);
    
    // Check quality score
    if (j.scores && j.scores[0]) {
      expect(j.scores[0].overall).toBeGreaterThanOrEqual(7);
    }
  });

  test("Instagram tutorial has proper structure", async ({ request }) => {
    const r = await request.post(`${base}/api/content/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "instagram", 
        postType: "tutorial", 
        tone: "friendly", 
        theme: "how to reheat pastries" 
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    expect(j.ok).toBeTruthy();
    expect(j.best.caption).toBeDefined();
    expect(j.best.cta).toBeDefined();
    
    // Instagram allows more characters
    expect(j.best.caption.length).toBeLessThanOrEqual(2200);
    
    // Should have educational content
    const caption = j.best.caption.toLowerCase();
    expect(
      caption.includes("how") || 
      caption.includes("step") || 
      caption.includes("tip") ||
      caption.includes("reheat")
    ).toBeTruthy();
  });

  test("LinkedIn announcement uses professional tone", async ({ request }) => {
    const r = await request.post(`${base}/api/content/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "linkedin", 
        postType: "announcement", 
        tone: "professional", 
        theme: "B2B catering launch" 
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    expect(j.ok).toBeTruthy();
    
    // LinkedIn allows longer content
    expect(j.best.caption.length).toBeLessThanOrEqual(3000);
    
    // Should have business-appropriate language
    const caption = j.best.caption.toLowerCase();
    expect(
      caption.includes("catering") || 
      caption.includes("business") || 
      caption.includes("office") ||
      caption.includes("corporate")
    ).toBeTruthy();
    
    // Fewer hashtags for LinkedIn
    expect(j.best.hashtags.length).toBeLessThanOrEqual(5);
  });

  test("Content respects brand voice and banned phrases", async ({ request }) => {
    // Set up brand with banned phrases
    await request.put(`${base}/api/brand/profile`, {
      headers: { "x-user-id": "starter-user-1" },
      data: {
        brandName: "Redbird Bakehouse",
        voice: "friendly",
        bannedPhrases: ["cheap", "low quality", "discount"],
        targetAudience: "local foodies"
      }
    });
    
    const r = await request.post(`${base}/api/content/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "facebook", 
        postType: "promo", 
        theme: "weekend special" 
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    const content = j.best.caption.toLowerCase();
    
    // Should not contain banned phrases
    expect(content).not.toContain("cheap");
    expect(content).not.toContain("low quality");
    expect(content).not.toContain("discount");
  });
});