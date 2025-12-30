import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';

test.describe('OG Image Preview Fix Verification', () => {
  test('ImageUpload shows preview for relative paths', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    await page.goto(`${BASE_URL}/admin/seo`);
    await page.waitForLoadState('networkidle');

    // Wait for React to fully render
    await page.waitForTimeout(1000);

    // Find the first OG Image URL input field
    const urlInput = page.locator('input[placeholder*="URL"]').first();
    await expect(urlInput).toBeVisible();

    // Enter a relative path that should now trigger preview
    await urlInput.fill('/assets/images/og-image.jpg');
    await urlInput.press('Tab'); // Trigger onChange

    await page.waitForTimeout(500);

    // Check if preview image appeared
    const previewImg = page.locator('img[alt="OG Image Preview"]').first();
    const isVisible = await previewImg.isVisible().catch(() => false);

    console.log(`Preview image visible: ${isVisible}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/og-preview-after-fix.png', fullPage: true });

    // Verify the image is displayed
    expect(isVisible).toBeTruthy();
  });

  test('Social preview card shows OG image', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/seo`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find the URL input and set a value
    const urlInput = page.locator('input[placeholder*="URL"]').first();
    await urlInput.fill('/assets/images/og-image.jpg');
    await urlInput.press('Tab');

    await page.waitForTimeout(500);

    // Check if the social preview card shows the image
    const socialPreviewImg = page.locator('.bg-white img, [class*="preview"] img').first();
    const isVisible = await socialPreviewImg.isVisible().catch(() => false);

    console.log(`Social preview image visible: ${isVisible}`);

    // Check all images on page now
    const allImages = page.locator('img');
    const count = await allImages.count();
    console.log(`Total images on page after setting URL: ${count}`);

    for (let i = 0; i < count; i++) {
      const img = allImages.nth(i);
      const src = await img.getAttribute('src');
      const visible = await img.isVisible();
      console.log(`Image ${i}: src="${src}", visible=${visible}`);
    }
  });
});
