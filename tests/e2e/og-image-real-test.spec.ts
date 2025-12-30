import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';

test.describe('OG Image Preview with Real Image', () => {
  test('ImageUpload shows preview for existing image', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    await page.goto(`${BASE_URL}/admin/seo`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Use an actual existing image file
    const realImagePath = '/assets/images/hero-tree.jpg';

    // Find the first OG Image URL input
    const urlInput = page.locator('input[placeholder*="URL"]').first();
    await expect(urlInput).toBeVisible();

    // Enter the real image path
    await urlInput.fill(realImagePath);
    await urlInput.press('Tab');

    await page.waitForTimeout(1000);

    // Check all images
    const allImages = page.locator('img');
    const count = await allImages.count();
    console.log(`Total images after setting URL: ${count}`);

    for (let i = 0; i < count; i++) {
      const img = allImages.nth(i);
      const src = await img.getAttribute('src');
      const visible = await img.isVisible();
      const box = await img.boundingBox();
      console.log(`Image ${i}: src="${src}", visible=${visible}, box=${JSON.stringify(box)}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/og-preview-real-image.png', fullPage: true });

    // Check if preview image is visible
    const previewImg = page.locator(`img[src="${realImagePath}"]`).first();
    const isVisible = await previewImg.isVisible().catch(() => false);
    console.log(`Preview image with real path visible: ${isVisible}`);

    expect(isVisible).toBeTruthy();
  });

  test('Verify real image loads correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/assets/images/hero-tree.jpg`);
    console.log(`hero-tree.jpg status: ${response.status()}`);
    console.log(`Content-Type: ${response.headers()['content-type']}`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image');
  });
});
