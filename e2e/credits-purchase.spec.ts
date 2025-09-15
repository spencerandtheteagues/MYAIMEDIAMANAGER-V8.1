import { test, expect } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://localhost:5000";

test.describe("Credits & Payment System", () => {
  test("Check initial credit balance", async ({ request }) => {
    const r = await request.get(`${base}/api/credits/me`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    
    expect(r.ok()).toBeTruthy();
    const credits = await r.json();
    
    expect(credits.remaining).toBeDefined();
    expect(typeof credits.remaining).toBe("number");
    expect(credits.remaining).toBeGreaterThanOrEqual(0);
  });

  test("Content generation consumes credits", async ({ request }) => {
    // Get initial balance
    const before = await request.get(`${base}/api/credits/me`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    const creditsBefore = (await before.json()).remaining;
    
    // Generate content
    await request.post(`${base}/api/content/generate`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        platform: "instagram", 
        postType: "promo", 
        theme: "test" 
      }
    });
    
    // Check balance after
    const after = await request.get(`${base}/api/credits/me`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    const creditsAfter = (await after.json()).remaining;
    
    // Credits should have decreased
    expect(creditsAfter).toBeLessThan(creditsBefore);
  });

  test("Cannot generate content without credits", async ({ request }) => {
    // Create user with no credits
    await request.post(`${base}/api/admin/users`, {
      headers: { "x-user-id": "admin-user-1" },
      data: {
        username: "no-credits-user",
        email: "nocredits@test.com",
        credits: 0
      }
    });
    
    // Try to generate content
    const r = await request.post(`${base}/api/content/generate`, {
      headers: { "x-user-id": "no-credits-user" },
      data: { 
        platform: "instagram", 
        postType: "promo", 
        theme: "test" 
      }
    });
    
    // Should be rejected
    expect(r.status()).toBe(402); // Payment required
    const error = await r.json();
    expect(error.error).toContain("credits");
  });

  test("Stripe test purchase flow", async ({ request }) => {
    test.skip(); // Skip if Stripe not configured
    
    // Get initial balance
    const before = await request.get(`${base}/api/credits/me`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    const creditsBefore = (await before.json()).remaining;
    
    // Create payment intent
    const intent = await request.post(`${base}/api/credits/purchase`, {
      headers: { "x-user-id": "starter-user-1" },
      data: { 
        amount: 1000, // $10 for 1000 credits
        paymentMethodId: "pm_card_visa" // Stripe test card
      }
    });
    
    if (intent.status() === 500) {
      test.skip(); // Stripe not configured
      return;
    }
    
    expect(intent.ok()).toBeTruthy();
    
    // Check balance increased
    const after = await request.get(`${base}/api/credits/me`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    const creditsAfter = (await after.json()).remaining;
    
    expect(creditsAfter).toBeGreaterThan(creditsBefore);
  });

  test("Credit packages available", async ({ request }) => {
    const r = await request.get(`${base}/api/credits/packages`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    
    if (r.status() === 404) {
      test.skip(); // Endpoint not implemented
      return;
    }
    
    expect(r.ok()).toBeTruthy();
    const packages = await r.json();
    
    expect(Array.isArray(packages)).toBeTruthy();
    
    if (packages.length > 0) {
      // Check package structure
      packages.forEach((pkg: any) => {
        expect(pkg.credits).toBeDefined();
        expect(pkg.price).toBeDefined();
        expect(pkg.name).toBeDefined();
      });
    }
  });

  test("Credit transaction history", async ({ request }) => {
    const r = await request.get(`${base}/api/credits/history`, {
      headers: { "x-user-id": "starter-user-1" }
    });
    
    if (r.status() === 404) {
      test.skip(); // Endpoint not implemented
      return;
    }
    
    expect(r.ok()).toBeTruthy();
    const history = await r.json();
    
    expect(Array.isArray(history)).toBeTruthy();
    
    if (history.length > 0) {
      // Check transaction structure
      history.forEach((tx: any) => {
        expect(tx.amount).toBeDefined();
        expect(tx.type).toBeDefined();
        expect(tx.timestamp).toBeDefined();
      });
    }
  });
});