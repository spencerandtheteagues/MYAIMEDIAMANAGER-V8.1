import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ART_DIR = process.env.ART_DIR || './test-artifacts';
const IMG_DIR = process.env.IMG_DIR || path.join(ART_DIR, 'images');
const VID_DIR = process.env.VID_DIR || path.join(ART_DIR, 'videos');
const SCR_DIR = process.env.SCR_DIR || path.join(ART_DIR, 'screens');
const DATA_DIR = process.env.DATA_DIR || path.join(ART_DIR, 'data');

test.describe('Content Generation', () => {
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
  
  test('should generate text content', async ({ page }) => {
    // Navigate to create page
    await page.goto('/create');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of create page
    await page.screenshot({ 
      path: path.join(SCR_DIR, '10-create-page.png'),
      fullPage: true 
    });
    
    // Fill in the prompt
    await page.fill('textarea[name="prompt"]', 'Create a social media post for a bakery announcing fresh croissants');
    
    // Select platform
    const platformSelect = page.locator('select[name="platform"], [data-testid="platform-select"]');
    if (await platformSelect.isVisible()) {
      await platformSelect.selectOption('instagram');
    }
    
    // Click generate button
    await page.click('button:has-text("Generate")');
    
    // Wait for content to appear
    await page.waitForSelector('[data-testid="generated-content"], .generated-content', { 
      timeout: 30000 
    });
    
    // Take screenshot of generated content
    await page.screenshot({ 
      path: path.join(SCR_DIR, '11-generated-text.png'),
      fullPage: true 
    });
    
    // Get the generated content
    const content = await page.textContent('[data-testid="generated-content"], .generated-content');
    
    // Save test data
    const contentData = {
      test: 'text-generation',
      timestamp: new Date().toISOString(),
      prompt: 'Create a social media post for a bakery announcing fresh croissants',
      content: content,
      length: content?.length || 0
    };
    
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, 'text-generation.json'),
      JSON.stringify(contentData, null, 2)
    );
    
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(10);
  });
  
  test('should generate image content', async ({ page }) => {
    // Navigate to create page
    await page.goto('/create');
    await page.waitForLoadState('networkidle');
    
    // Fill in the prompt
    await page.fill('textarea[name="prompt"]', 'Neon gradient abstract background for social media');
    
    // Enable image generation
    const imageToggle = page.locator('input[type="checkbox"][name="generateImage"], [data-testid="generate-image-toggle"]');
    if (await imageToggle.isVisible()) {
      await imageToggle.check();
    }
    
    // Click generate button
    await page.click('button:has-text("Generate")');
    
    // Wait for image to appear (longer timeout for image generation)
    await page.waitForSelector('img[data-testid="generated-image"], .generated-image img', { 
      timeout: 60000 
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(SCR_DIR, '12-generated-image.png'),
      fullPage: true 
    });
    
    // Get image URL
    const imageUrl = await page.getAttribute('img[data-testid="generated-image"], .generated-image img', 'src');
    
    // Download the image if it's a data URL or regular URL
    if (imageUrl) {
      let imageData: Buffer;
      if (imageUrl.startsWith('data:')) {
        // Extract base64 data
        const base64Data = imageUrl.split(',')[1];
        imageData = Buffer.from(base64Data, 'base64');
      } else {
        // Download from URL
        const response = await page.request.get(imageUrl);
        imageData = await response.body();
      }
      
      // Save image
      fs.mkdirSync(IMG_DIR, { recursive: true });
      const imagePath = path.join(IMG_DIR, `generated-${Date.now()}.png`);
      fs.writeFileSync(imagePath, imageData);
      
      // Save metadata
      const imageMetadata = {
        test: 'image-generation',
        timestamp: new Date().toISOString(),
        prompt: 'Neon gradient abstract background for social media',
        imageUrl: imageUrl.substring(0, 100),
        imagePath: imagePath,
        imageSize: imageData.length
      };
      
      fs.writeFileSync(
        path.join(DATA_DIR, 'image-generation.json'),
        JSON.stringify(imageMetadata, null, 2)
      );
    }
    
    expect(imageUrl).toBeTruthy();
  });
  
  test.skip('should generate video content', async ({ page }) => {
    // Skip if no video API key
    if (!process.env.VERTEX_AI_PROJECT) {
      test.skip();
      return;
    }
    
    // Navigate to create page
    await page.goto('/create');
    await page.waitForLoadState('networkidle');
    
    // Fill in the prompt
    await page.fill('textarea[name="prompt"]', 'Cinematic shot of ocean waves at sunset');
    
    // Enable video generation
    const videoToggle = page.locator('input[type="checkbox"][name="generateVideo"], [data-testid="generate-video-toggle"]');
    if (await videoToggle.isVisible()) {
      await videoToggle.check();
    }
    
    // Click generate button
    await page.click('button:has-text("Generate")');
    
    // Wait for video to appear (very long timeout for video)
    await page.waitForSelector('video[data-testid="generated-video"], .generated-video video', { 
      timeout: 120000 
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(SCR_DIR, '13-generated-video.png'),
      fullPage: true 
    });
    
    // Get video URL
    const videoUrl = await page.getAttribute('video[data-testid="generated-video"], .generated-video video', 'src');
    
    expect(videoUrl).toBeTruthy();
  });
});