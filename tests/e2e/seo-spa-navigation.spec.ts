import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';

test.describe('SPA Navigation SEO Updates', () => {
  test('should update meta tags when navigating between pages via SPA', async ({ page }) => {
    console.log('1. Loading home page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Get initial home page title
    const homeTitle = await page.title();
    console.log(`   Home title: ${homeTitle}`);
    expect(homeTitle.length).toBeGreaterThan(0);

    // Get home page og:title
    const homeOgTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    console.log(`   Home og:title: ${homeOgTitle}`);

    console.log('2. Navigating to news page via SPA link...');
    // Click on news link in the navbar or footer
    await page.click('a[href="/news"]');
    await page.waitForURL('**/news');
    await page.waitForTimeout(1000); // Wait for Helmet to update

    // Check news page title was updated (should be different from home)
    const newsTitle = await page.title();
    console.log(`   News page title: ${newsTitle}`);
    expect(newsTitle).not.toBe(homeTitle);
    expect(newsTitle.length).toBeGreaterThan(0);

    // Check og:title was updated
    const newsOgTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    console.log(`   News og:title: ${newsOgTitle}`);
    expect(newsOgTitle).not.toBe(homeOgTitle);

    console.log('3. Navigating to a news article via SPA...');
    // Click on the first news article
    const firstArticle = page.locator('a[href^="/news/"]').first();
    await firstArticle.click();
    await page.waitForURL('**/news/**');
    await page.waitForTimeout(1000); // Wait for Helmet to update

    // Check article title was updated
    const articleTitle = await page.title();
    console.log(`   Article title: ${articleTitle}`);
    expect(articleTitle).not.toBe(newsTitle);

    // Check og:title was updated
    const articleOgTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    console.log(`   Article og:title: ${articleOgTitle}`);
    expect(articleOgTitle).not.toBe(newsOgTitle);

    console.log('4. Navigating back to home via SPA...');
    // Click on logo or home link
    await page.click('a[href="/"]');
    await page.waitForURL(BASE_URL + '/');
    await page.waitForTimeout(1000);

    // Verify title is back to home
    const finalTitle = await page.title();
    console.log(`   Final home title: ${finalTitle}`);
    expect(finalTitle).toBe(homeTitle);

    console.log('5. Test PASSED - SPA navigation updates meta tags correctly!');
  });

  test('should update meta tags when navigating to location page', async ({ page }) => {
    console.log('1. Loading home page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const homeTitle = await page.title();
    console.log(`   Home title: ${homeTitle}`);

    console.log('2. Navigating to location page via SPA...');
    // Navigate to a location page
    await page.goto(`${BASE_URL}/locations/butovo`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check location page title was set
    const locationTitle = await page.title();
    console.log(`   Location title: ${locationTitle}`);
    expect(locationTitle).not.toBe(homeTitle);

    // Check og:title
    const locationOgTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    console.log(`   Location og:title: ${locationOgTitle}`);

    // Check og:image has absolute URL
    const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    console.log(`   Location og:image: ${ogImage}`);
    expect(ogImage).toMatch(/^https?:\/\//);

    console.log('3. Test PASSED - Location page meta tags are correct!');
  });

  test('should have server-side meta injection for crawlers', async ({ page }) => {
    console.log('1. Fetching home page with crawler-like request...');

    // Fetch raw HTML without JavaScript execution
    const response = await page.request.get(BASE_URL);
    const html = await response.text();

    // Check that meta tags are present in the initial HTML (server-side)
    console.log('2. Checking server-side meta tags in HTML...');

    expect(html).toContain('<title');
    expect(html).toContain('og:title');
    expect(html).toContain('og:description');
    expect(html).toContain('og:image');

    console.log('3. Fetching location page...');
    const locationResponse = await page.request.get(`${BASE_URL}/locations/butovo`);
    const locationHtml = await locationResponse.text();

    // Extract title from HTML (accounts for data-rh attribute)
    const titleMatch = locationHtml.match(/<title[^>]*>([^<]+)<\/title>/);
    console.log(`   Server-side title: ${titleMatch?.[1]}`);
    expect(titleMatch).toBeTruthy();

    // Extract og:title (accounts for data-rh attribute)
    const ogTitleMatch = locationHtml.match(/property="og:title" content="([^"]+)"/);
    console.log(`   Server-side og:title: ${ogTitleMatch?.[1]}`);
    expect(ogTitleMatch).toBeTruthy();

    console.log('4. Test PASSED - Server-side meta injection works!');
  });
});
