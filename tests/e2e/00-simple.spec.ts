import { test, expect } from '@playwright/test';

test.describe('Simple Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if page title exists
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check for some content on the page
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
  
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check if login form exists
    const emailInput = await page.isVisible('input[name="email"], input[type="email"]');
    const passwordInput = await page.isVisible('input[name="password"], input[type="password"]');
    
    expect(emailInput || passwordInput).toBeTruthy();
  });
  
  test('should check API health', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});