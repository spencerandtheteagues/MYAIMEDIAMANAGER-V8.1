import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ART_DIR = process.env.ART_DIR || './test-artifacts';
const SCR_DIR = process.env.SCR_DIR || path.join(ART_DIR, 'screens');
const DATA_DIR = process.env.DATA_DIR || path.join(ART_DIR, 'data');

test.describe('Authentication', () => {
  test('should allow signup and login', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@myaimediamgr.com`;
    const testPassword = 'Test123!@#';
    
    // Go to home page
    await page.goto('/');
    
    // Take screenshot of landing page
    await page.screenshot({ 
      path: path.join(SCR_DIR, '01-landing-page.png'),
      fullPage: true 
    });
    
    // Navigate to signup
    await page.click('text=Get Started');
    await page.waitForURL('**/signup');
    
    // Fill signup form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="username"]', `testuser${timestamp}`);
    await page.fill('input[name="businessName"]', 'Test Business');
    
    // Take screenshot of signup form
    await page.screenshot({ 
      path: path.join(SCR_DIR, '02-signup-form.png') 
    });
    
    // Submit signup
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or login
    await page.waitForURL(/(dashboard|login|verify)/, { timeout: 10000 });
    
    // If redirected to verify, note it
    if (page.url().includes('verify')) {
      await page.screenshot({ 
        path: path.join(SCR_DIR, '03-verify-email.png') 
      });
    }
    
    // Try to login
    if (!page.url().includes('dashboard')) {
      await page.goto('/login');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: path.join(SCR_DIR, '04-dashboard.png'),
      fullPage: true 
    });
    
    // Save test data
    const authData = {
      test: 'auth',
      timestamp: new Date().toISOString(),
      email: testEmail,
      success: page.url().includes('dashboard')
    };
    
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, 'auth-test.json'),
      JSON.stringify(authData, null, 2)
    );
    
    expect(page.url()).toContain('dashboard');
  });
  
  test('should enforce login for protected routes', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/create');
    
    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });
    
    await page.screenshot({ 
      path: path.join(SCR_DIR, '05-login-redirect.png') 
    });
    
    expect(page.url()).toContain('login');
  });
});