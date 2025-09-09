import { test, expect } from '@playwright/test';

test('approval queue: draft → pending → approved → scheduled', async ({ request }) => {
  const base = process.env.E2E_BASE_URL || 'http://localhost:5000';
  
  // Login first to get session
  const loginRes = await request.post(`${base}/api/auth/login`, {
    data: { email: 'spencer@myaimediamgr.com', password: 'Demo1234!' }
  });
  expect(loginRes.ok()).toBeTruthy();
  
  // create draft
  let r = await request.post(`${base}/api/posts`, { 
    data: { kind: 'image', caption: 'hello' }
  });
  expect(r.ok()).toBeTruthy();
  const post = await r.json();

  // submit
  r = await request.post(`${base}/api/posts/submit`, { 
    data: { id: post.id }
  });
  expect(r.ok()).toBeTruthy();

  // approve
  r = await request.post(`${base}/api/posts/approve`, { 
    data: { id: post.id }
  });
  expect(r.ok()).toBeTruthy();

  // schedule
  const inTwoMin = new Date(Date.now()+120000).toISOString();
  r = await request.post(`${base}/api/posts/schedule`, { 
    data: { id: post.id, scheduled_at: inTwoMin }
  });
  expect(r.ok()).toBeTruthy();
});