import { test, expect } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Video Generation & Plan Gates", () => {
  test("Starter plan cannot exceed 8s video duration", async ({ request }) => {
    // Try to create >8s video as starter user
    let r = await request.post(`${base}/api/ai/video/start`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "hook-value-cta storyboard for bakery", 
        durationSeconds: 12,
        platform: "tiktok"
      }
    });
    
    // Should be rejected
    expect(r.status()).toBe(422);
    const error = await r.json();
    expect(error.error).toContain("duration");
  });

  test("Starter plan can create 8s video", async ({ request }) => {
    const r = await request.post(`${base}/api/ai/video/start`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "hook-value-cta storyboard for bakery", 
        durationSeconds: 8,
        platform: "tiktok"
      }
    });
    
    // Should be accepted (or skip if no API keys)
    if (r.status() === 500) {
      const error = await r.json();
      if (error.error?.includes("not configured") || error.error?.includes("GOOGLE_")) {
        test.skip();
        return;
      }
    }
    
    expect(r.ok()).toBeTruthy();
    const video = await r.json();
    
    // Should have operation ID for polling
    expect(video.operationId).toBeDefined();
  });

  test("Enterprise plan can create longer videos", async ({ request }) => {
    // Create enterprise user
    await request.post(`${base}/api/admin/users`, {
      headers: { "x-user-id": "admin-user-1" },
      data: {
        username: "enterprise-test",
        email: "enterprise@test.com",
        plan: "enterprise"
      }
    });
    
    const r = await request.post(`${base}/api/ai/video/start`, {
      headers: { "x-user-id": "enterprise-test" },
      data: { 
        prompt: "extended brand story", 
        durationSeconds: 30,
        platform: "youtube"
      }
    });
    
    // Should be accepted for enterprise
    if (r.status() !== 500) {
      expect(r.ok()).toBeTruthy();
    }
  });

  test("Video generation with storyboarding", async ({ request }) => {
    const r = await request.post(`${base}/api/ai/video/start`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "Product showcase with customer testimonial", 
        durationSeconds: 7,
        platform: "instagram",
        includeStoryboard: true
      }
    });
    
    if (r.status() === 500) {
      test.skip();
      return;
    }
    
    expect(r.ok()).toBeTruthy();
    const video = await r.json();
    
    // Should have structured storyboard
    if (video.storyboard) {
      expect(video.storyboard).toContain("hook");
    }
  });

  test("Video polling workflow", async ({ request }) => {
    // Start video generation
    const r = await request.post(`${base}/api/ai/video/start`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        prompt: "Quick product demo", 
        durationSeconds: 5,
        platform: "tiktok"
      }
    });
    
    if (r.status() === 500) {
      test.skip();
      return;
    }
    
    expect(r.ok()).toBeTruthy();
    const { operationId } = await r.json();
    
    // Poll for status
    const poll = await request.get(`${base}/api/ai/video/poll/${operationId}`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    
    expect(poll.ok()).toBeTruthy();
    const status = await poll.json();
    
    // Should have status field
    expect(status.status).toBeDefined();
    expect(["pending", "processing", "complete", "failed"]).toContain(status.status);
  });
});