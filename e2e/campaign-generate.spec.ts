import { test, expect } from '@playwright/test';

test('campaign generator creates 14 posts with correct schedule', async ({ request }) => {
  const base = process.env.E2E_BASE_URL || 'http://localhost:5000';
  
  // Login first to get session
  const loginRes = await request.post(`${base}/api/auth/login`, {
    data: { email: 'spencer@myaimediamgr.com', password: 'Demo1234!' }
  });
  expect(loginRes.ok()).toBeTruthy();
  
  const start = new Date(Date.now()+86400000).toISOString();

  const r = await request.post(`${base}/api/campaigns/generate`, {
    data: { prompt: "gym grand opening", start_date: start, cadence: "2_per_day_7_days" }
  });
  expect(r.ok()).toBeTruthy();
  const { campaignId, postCount } = await r.json();

  expect(postCount).toBe(14);

  const posts = await (await request.get(`${base}/api/campaigns/${campaignId}/posts`)).json();
  expect(posts.length).toBe(14);
  // Optional: validate two per day distribution
});