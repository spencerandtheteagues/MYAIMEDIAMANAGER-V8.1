import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ART_DIR = process.env.ART_DIR || './test-artifacts';
const SCR_DIR = process.env.SCR_DIR || path.join(ART_DIR, 'screens');
const DATA_DIR = process.env.DATA_DIR || path.join(ART_DIR, 'data');

test.describe('Approval Queue', () => {
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
  
  test('should display approval queue and allow approval/rejection', async ({ page }) => {
    // Navigate to approval queue
    await page.goto('/approval');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of approval queue
    await page.screenshot({ 
      path: path.join(SCR_DIR, '40-approval-queue.png'),
      fullPage: true 
    });
    
    // Check for queue elements
    const queueVisible = await page.isVisible('[data-testid="approval-queue"], .approval-queue');
    
    // Look for pending posts
    const pendingPosts = await page.locator('[data-testid="pending-post"], .pending-post').count();
    
    if (pendingPosts > 0) {
      // Click on first pending post
      await page.click('[data-testid="pending-post"], .pending-post');
      
      // Wait for post details
      await page.waitForSelector('[data-testid="post-details"], .post-details', { timeout: 5000 });
      
      // Take screenshot of post details
      await page.screenshot({ 
        path: path.join(SCR_DIR, '41-post-details.png') 
      });
      
      // Check for approve/reject buttons
      const approveButton = page.locator('button:has-text("Approve")');
      const rejectButton = page.locator('button:has-text("Reject")');
      
      expect(await approveButton.isVisible() || await rejectButton.isVisible()).toBe(true);
    }
    
    // Save approval queue data
    const approvalData = {
      test: 'approval-queue',
      timestamp: new Date().toISOString(),
      queueVisible,
      pendingPosts
    };
    
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, 'approval-queue-test.json'),
      JSON.stringify(approvalData, null, 2)
    );
  });
});