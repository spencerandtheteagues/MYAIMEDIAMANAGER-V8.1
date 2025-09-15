import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ART_DIR = process.env.ART_DIR || './test-artifacts';
const SCR_DIR = process.env.SCR_DIR || path.join(ART_DIR, 'screens');
const DATA_DIR = process.env.DATA_DIR || path.join(ART_DIR, 'data');

test.describe('Campaigns', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test account
    const testEmail = process.env.TEST_ENTERPRISE_EMAIL || 'spencer@myaimediamgr.com';
    const testPassword = process.env.TEST_ENTERPRISE_PASSWORD || 'Admin123!';
    
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });
  
  test('should create a 14-post campaign', async ({ page }) => {
    // Navigate to campaigns page
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of campaigns page
    await page.screenshot({ 
      path: path.join(SCR_DIR, '20-campaigns-page.png'),
      fullPage: true 
    });
    
    // Click create campaign button
    await page.click('button:has-text("Create Campaign"), button:has-text("New Campaign")');
    
    // Fill campaign form
    const campaignName = `Test Campaign ${Date.now()}`;
    await page.fill('input[name="name"]', campaignName);
    await page.fill('textarea[name="description"]', 'Automated test campaign for verification');
    
    // Select platforms
    const instagramCheckbox = page.locator('input[type="checkbox"][value="instagram"]');
    if (await instagramCheckbox.isVisible()) {
      await instagramCheckbox.check();
    }
    
    // Set dates (7 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    await page.fill('input[name="startDate"]', startDate.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', endDate.toISOString().split('T')[0]);
    
    // Set posts per day
    await page.fill('input[name="postsPerDay"]', '2');
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: path.join(SCR_DIR, '21-campaign-form.png') 
    });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for campaign creation (this may take time due to AI generation)
    await page.waitForSelector('[data-testid="campaign-created"], .campaign-success', { 
      timeout: 90000 
    });
    
    // Take screenshot of created campaign
    await page.screenshot({ 
      path: path.join(SCR_DIR, '22-campaign-created.png'),
      fullPage: true 
    });
    
    // Check for 14 posts (2 per day * 7 days)
    const postElements = await page.locator('[data-testid="campaign-post"], .campaign-post').count();
    
    // Save campaign data
    const campaignData = {
      test: 'campaign-creation',
      timestamp: new Date().toISOString(),
      name: campaignName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      postsPerDay: 2,
      expectedPosts: 14,
      actualPosts: postElements
    };
    
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, 'campaign-test.json'),
      JSON.stringify(campaignData, null, 2)
    );
    
    expect(postElements).toBe(14);
  });
});