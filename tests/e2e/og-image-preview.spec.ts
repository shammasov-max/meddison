import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';

test.describe('OG Image Preview Debug', () => {
  test('Check admin SEO page OG image previews', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto(`${BASE_URL}/admin/seo`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/seo-page-initial.png', fullPage: true });

    // Find all image elements
    const allImages = page.locator('img');
    const imageCount = await allImages.count();
    console.log(`Found ${imageCount} total images on page`);

    // Check for OG image specific elements
    const ogImageInputs = page.locator('input[name*="og"], input[placeholder*="image"], input[type="url"]');
    const inputCount = await ogImageInputs.count();
    console.log(`Found ${inputCount} OG-related inputs`);

    // Get all image src attributes
    for (let i = 0; i < imageCount; i++) {
      const img = allImages.nth(i);
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const isVisible = await img.isVisible();
      const box = await img.boundingBox();
      console.log(`Image ${i}: src="${src}", alt="${alt}", visible=${isVisible}, size=${box?.width}x${box?.height}`);
    }

    // Look for preview containers
    const previewContainers = page.locator('[class*="preview"], [class*="Preview"], [class*="og"], [class*="image"]');
    const previewCount = await previewContainers.count();
    console.log(`Found ${previewCount} preview-related containers`);

    // Check for broken images (images that failed to load)
    const brokenImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const broken: string[] = [];
      images.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
          broken.push(img.src || 'no-src');
        }
      });
      return broken;
    });
    console.log('Broken images:', brokenImages);

    // Get page HTML for debugging
    const bodyHTML = await page.locator('body').innerHTML();

    // Look for OG image URL patterns in the HTML
    const ogImageMatches = bodyHTML.match(/og[_-]?image|preview|\.jpg|\.png|\.webp/gi);
    console.log('OG-related patterns found:', ogImageMatches?.slice(0, 20));

    // Take final screenshot
    await page.screenshot({ path: 'test-results/seo-page-final.png', fullPage: true });
  });

  test('Test OG image URLs directly', async ({ request }) => {
    // First get the data to find OG image URLs
    const dataResponse = await request.get(`${BASE_URL}/api/data`);
    const data = await dataResponse.json();

    console.log('SEO data:', JSON.stringify(data.seo || {}, null, 2));

    // Check content API for SEO settings
    const seoResponse = await request.get(`${BASE_URL}/api/content/seo`);
    const seoContent = await seoResponse.json();
    console.log('SEO content from API:', JSON.stringify(seoContent, null, 2));

    // Try to fetch common OG image paths
    const possiblePaths = [
      '/assets/images/og-image.jpg',
      '/uploads/og-image.jpg',
      '/assets/og-image.jpg',
    ];

    for (const path of possiblePaths) {
      const response = await request.get(`${BASE_URL}${path}`);
      console.log(`${path}: ${response.status()}`);
    }
  });

  test('Inspect preview component rendering', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/seo`);
    await page.waitForLoadState('networkidle');

    // Wait for React to fully render
    await page.waitForTimeout(2000);

    // Get all elements with background-image style
    const elementsWithBgImage = await page.evaluate(() => {
      const elements: { selector: string; bgImage: string }[] = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          elements.push({
            selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
            bgImage: style.backgroundImage
          });
        }
      });
      return elements;
    });
    console.log('Elements with background-image:', elementsWithBgImage);

    // Check for empty containers that might be preview areas
    const emptyContainers = await page.evaluate(() => {
      const empties: { selector: string; size: string }[] = [];
      document.querySelectorAll('div, section, aside').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 50 && el.children.length === 0 && !el.textContent?.trim()) {
          empties.push({
            selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
            size: `${rect.width}x${rect.height}`
          });
        }
      });
      return empties;
    });
    console.log('Empty containers (possible preview areas):', emptyContainers);
  });
});
