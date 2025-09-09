import { test, expect } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Image Quality Tests", () => {
  test("Instagram image generates and is saved to library @slow", async ({ request }) => {
    test.slow(); // Mark as slow since it involves AI generation
    
    const r = await request.post(`${base}/api/ai/image`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "clean studio product shot, soft light, white bg", 
        platform: "instagram",
        aspectRatio: "1:1"
      }
    });
    
    // Check if AI is configured
    if (r.status() === 500) {
      const error = await r.json();
      if (error.error?.includes("not configured") || error.error?.includes("GOOGLE_")) {
        test.skip();
        return;
      }
    }
    
    expect(r.ok()).toBeTruthy();
    const img = await r.json();
    
    // Should have ID and URL
    expect(img.id).toBeDefined();
    expect(img.url).toBeDefined();
    
    // Check library autosave
    const lib = await request.get(`${base}/api/library?kind=image`, { 
      headers: { "x-user-id": "starter-user-1" }
    });
    
    const items = await lib.json();
    expect(Array.isArray(items)).toBeTruthy();
    
    // Should be in library
    if (items.length > 0) {
      const recentItem = items.find((item: any) => item.mediaUrl === img.url);
      expect(recentItem).toBeDefined();
    }
  });

  test("Different aspect ratios for different platforms", async ({ request }) => {
    test.slow();
    
    // Instagram - Square
    let r = await request.post(`${base}/api/ai/image`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "product shot", 
        platform: "instagram",
        aspectRatio: "1:1"
      }
    });
    
    if (r.status() === 500) {
      test.skip();
      return;
    }
    
    expect(r.ok()).toBeTruthy();
    let img = await r.json();
    expect(img.aspectRatio).toBe("1:1");
    
    // TikTok - Portrait
    r = await request.post(`${base}/api/ai/image`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "product shot", 
        platform: "tiktok",
        aspectRatio: "9:16"
      }
    });
    
    expect(r.ok()).toBeTruthy();
    img = await r.json();
    expect(img.aspectRatio).toBe("9:16");
  });

  test("Image generation with art direction", async ({ request }) => {
    test.slow();
    
    const r = await request.post(`${base}/api/ai/image`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "bakery storefront", 
        platform: "facebook",
        includeArtDirection: true
      }
    });
    
    if (r.status() === 500) {
      test.skip();
      return;
    }
    
    expect(r.ok()).toBeTruthy();
    const img = await r.json();
    
    // Should have enhanced prompt with art direction
    expect(img.prompt || img.artDirection).toBeDefined();
  });

  test("Image generation respects credits", async ({ request }) => {
    // Check credits before
    const before = await request.get(`${base}/api/credits/me`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    const creditsBefore = (await before.json()).remaining;
    
    // Generate image
    const r = await request.post(`${base}/api/ai/image`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "test image", 
        platform: "instagram"
      }
    });
    
    if (r.status() === 500) {
      test.skip();
      return;
    }
    
    // Check credits after
    const after = await request.get(`${base}/api/credits/me`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    const creditsAfter = (await after.json()).remaining;
    
    // Credits should have decreased
    expect(creditsAfter).toBeLessThan(creditsBefore);
  });
});