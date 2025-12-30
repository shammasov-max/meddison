import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'medisson2024';

test.describe('Centralized Location SEO Update via /admin/seo', () => {
  test('should update location SEO title from AdminSEO page', async ({ browser }) => {
    // Generate unique test value
    const testSeoTitle = `LOCATION SEO ${Date.now()}`;
    const locationSlug = 'butovo';

    // Tab 1: Admin SEO panel - update location SEO fields
    const adminContext = await browser.newContext({
      httpCredentials: {
        username: ADMIN_USER,
        password: ADMIN_PASS,
      },
    });
    const adminPage = await adminContext.newPage();

    console.log('1. Navigating to admin SEO page...');
    await adminPage.goto(`${BASE_URL}/admin/seo`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1000);

    // Expand "Локации" section
    console.log('2. Expanding Локации section...');
    const locationsSection = adminPage.locator('button:has-text("Локации")');
    await locationsSection.click();
    await adminPage.waitForTimeout(500);

    // Find the location card by its URL
    console.log('3. Finding location card...');
    const locationUrl = `/locations/${locationSlug}`;
    const locationCard = adminPage.locator(`p:has-text("${locationUrl}")`).locator('xpath=ancestor::div[contains(@class, "bg-zinc-900")]');

    // Find and fill the Meta Title input within this card
    console.log('4. Filling SEO title field...');
    const titleInput = locationCard.locator('input[placeholder="Заголовок страницы"]');
    await titleInput.fill(testSeoTitle);
    await adminPage.waitForTimeout(500);

    // Save the changes
    console.log('5. Saving changes...');
    adminPage.on('dialog', dialog => dialog.accept());
    await adminPage.locator('button:has-text("Сохранить")').click();
    await adminPage.waitForTimeout(2000);

    // Tab 2: Public page - verify meta tags
    console.log('6. Opening public location page...');
    const verifyContext = await browser.newContext();
    const verifyPage = await verifyContext.newPage();

    await verifyPage.goto(`${BASE_URL}/locations/${locationSlug}`);
    await verifyPage.waitForLoadState('networkidle');

    // Wait for React to hydrate and useData() to load SEO data
    console.log('7. Waiting for client-side SEO data to load...');
    await verifyPage.waitForFunction(
      (expected) => document.title.includes(expected),
      testSeoTitle,
      { timeout: 10000 }
    ).catch(() => console.log('   Waiting for React Helmet update...'));

    // Small delay to ensure Helmet has updated
    await verifyPage.waitForTimeout(1000);

    // Check the page title and meta tags
    console.log('8. Verifying meta title...');
    const pageTitle = await verifyPage.title();
    const metaTitle = await verifyPage.locator('meta[property="og:title"]').first().getAttribute('content');

    console.log(`   Page title: ${pageTitle}`);
    console.log(`   OG meta title: ${metaTitle}`);
    console.log(`   Expected: ${testSeoTitle}`);

    // Verify SEO title is applied
    const titleMatches = pageTitle.includes(testSeoTitle) || metaTitle?.includes(testSeoTitle);
    expect(titleMatches, `Expected title to contain "${testSeoTitle}"`).toBeTruthy();

    console.log('9. Test PASSED - Location SEO update works!');

    await adminContext.close();
    await verifyContext.close();
  });
});
