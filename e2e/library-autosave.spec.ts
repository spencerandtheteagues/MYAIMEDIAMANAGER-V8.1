import { test, expect } from '@playwright/test';

test('image gen auto-saves to library; text does not', async ({ request }) => {
  const base = process.env.E2E_BASE_URL || 'http://localhost:5000';
  
  // Login first to get session
  const loginRes = await request.post(`${base}/api/auth/login`, {
    data: { email: 'spencer@myaimediamgr.com', password: 'Demo1234!' }
  });
  expect(loginRes.ok()).toBeTruthy();

  const img = await request.post(`${base}/api/ai/image`, { 
    data: { prompt: "red cube" }
  });
  expect(img.ok()).toBeTruthy();

  const lib = await request.get(`${base}/api/library?kind=image`);
  const items = await lib.json();
  expect(items.length).toBeGreaterThan(0);

  const txt = await request.post(`${base}/api/ai/text`, { 
    data: { prompt: "tagline" }
  });
  expect(txt.ok()).toBeTruthy();

  const libText = await request.get(`${base}/api/library?kind=text`);
  const textItems = await libText.json();
  expect(textItems.length).toBe(0);
});