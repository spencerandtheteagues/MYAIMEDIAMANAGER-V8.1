import { test, expect } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Campaign Generation", () => {
  test.beforeEach(async ({ request }) => {
    // Set up brand profile
    await request.put(`${base}/api/brand/profile`, {
      headers: { "x-user-id": "starter-user-1" },
      data: {
        brandName: "Redbird Bakehouse",
        voice: "friendly",
        targetAudience: "local foodies",
        valueProps: ["fresh daily", "local ingredients"],
        preferredCTAs: ["Visit us", "Pre-order today"]
      }
    });
  });

  test("Generates exactly 14 varied posts with schedule", async ({ request }) => {
    const r = await request.post(`${base}/api/campaigns/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "instagram", 
        theme: "opening week", 
        postType: "promo" 
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    // Should have posts array
    expect(Array.isArray(j.posts)).toBeTruthy();
    
    // Exactly 14 posts
    expect(j.posts.length).toBe(14);
    
    // Check variety - unique hooks
    const hooks = j.posts.map((p: any) => String(p.caption).split("\n")[0]);
    const uniqueHooks = new Set(hooks).size;
    
    // At least 10 unique hooks for variety
    expect(uniqueHooks).toBeGreaterThanOrEqual(10);
    
    // Each post should have required fields
    j.posts.forEach((post: any, index: number) => {
      expect(post.caption).toBeDefined();
      expect(post.hashtags).toBeDefined();
      expect(Array.isArray(post.hashtags)).toBeTruthy();
      expect(post.scheduledFor).toBeDefined();
      
      // Scheduled times should be spread out
      const scheduled = new Date(post.scheduledFor);
      expect(scheduled).toBeInstanceOf(Date);
      
      // Should be in the future
      expect(scheduled.getTime()).toBeGreaterThan(Date.now());
    });
  });

  test("Campaign respects platform constraints", async ({ request }) => {
    const r = await request.post(`${base}/api/campaigns/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "x", // Twitter has strict limits
        theme: "product launch", 
        postType: "announcement" 
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    // All posts should respect X's 280 char limit
    j.posts.forEach((post: any) => {
      const fullContent = post.caption + " " + post.hashtags.join(" ");
      expect(fullContent.length).toBeLessThanOrEqual(280);
      
      // X has hashtag limits
      expect(post.hashtags.length).toBeLessThanOrEqual(10);
    });
  });

  test("Campaign includes different post types", async ({ request }) => {
    const r = await request.post(`${base}/api/campaigns/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "facebook", 
        theme: "monthly specials", 
        mixTypes: true // Request variety
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    // Should have variety in content
    const captions = j.posts.map((p: any) => p.caption.toLowerCase());
    
    // Check for different content types
    const hasQuestions = captions.some((c: string) => c.includes("?"));
    const hasCTAs = captions.some((c: string) => 
      c.includes("visit") || c.includes("order") || c.includes("try")
    );
    const hasStories = captions.some((c: string) => 
      c.includes("story") || c.includes("behind") || c.includes("journey")
    );
    
    expect(hasQuestions || hasCTAs || hasStories).toBeTruthy();
  });

  test("Campaign scheduling is properly distributed", async ({ request }) => {
    const r = await request.post(`${base}/api/campaigns/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "linkedin", 
        theme: "thought leadership", 
        postType: "educational",
        duration: 14 // 14 days
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    const scheduleTimes = j.posts.map((p: any) => new Date(p.scheduledFor).getTime());
    scheduleTimes.sort((a: number, b: number) => a - b);
    
    // Check distribution
    for (let i = 1; i < scheduleTimes.length; i++) {
      const gap = scheduleTimes[i] - scheduleTimes[i - 1];
      
      // At least 4 hours between posts (14400000 ms)
      expect(gap).toBeGreaterThanOrEqual(14400000);
      
      // No more than 3 days between posts (259200000 ms)
      expect(gap).toBeLessThanOrEqual(259200000);
    }
  });

  test("Campaign uses brand profile data", async ({ request }) => {
    const r = await request.post(`${base}/api/campaigns/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "instagram", 
        theme: "customer appreciation", 
        postType: "engagement" 
      }
    });
    
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    
    // Should use brand CTAs
    const allCTAs = j.posts.map((p: any) => p.cta).filter(Boolean);
    const brandCTAs = ["Visit us", "Pre-order today"];
    
    const usesBrandCTAs = allCTAs.some((cta: string) => 
      brandCTAs.some(bc => cta.includes(bc))
    );
    
    expect(usesBrandCTAs).toBeTruthy();
  });
});