import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'medisson2024';

test.describe('News SEO Update', () => {
  test('should update SEO meta title for news item', async ({ browser }) => {
    // Generate unique test value
    const testSeoTitle = `TEST SEO TITLE ${Date.now()}`;

    // Tab 1: Admin panel - update SEO fields
    const adminContext = await browser.newContext({
      httpCredentials: {
        username: ADMIN_USER,
        password: ADMIN_PASS,
      },
    });
    const adminPage = await adminContext.newPage();

    console.log('1. Navigating to admin news page...');
    await adminPage.goto(`${BASE_URL}/admin/news`);
    await adminPage.waitForLoadState('networkidle');

    // Click on the first news item to edit
    console.log('2. Clicking on first news item...');
    await adminPage.locator('tbody tr').first().click();
    await adminPage.waitForLoadState('networkidle');

    // Get the news slug for later verification
    const slugInput = adminPage.locator('input[placeholder="auto-generated"]');
    const newsSlug = await slugInput.inputValue();
    console.log(`   News slug: ${newsSlug}`);

    // Find and fill SEO title field - locate by label text
    console.log('3. Filling SEO title field...');
    // Find the SEO section and its input
    const seoSection = adminPage.locator('text=SEO заголовок (meta title)').locator('..').locator('input');
    await seoSection.fill(testSeoTitle);

    // Save the changes
    console.log('4. Saving changes...');
    // Handle the alert dialog before clicking
    adminPage.on('dialog', dialog => dialog.accept());
    await adminPage.locator('button:has-text("Сохранить")').click();
    await adminPage.waitForTimeout(2000);

    // Tab 2: Public page - verify meta tags
    console.log('5. Opening public news page...');
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();

    await publicPage.goto(`${BASE_URL}/news/${newsSlug}`);
    await publicPage.waitForLoadState('networkidle');

    // Check the page title or meta tag
    console.log('6. Verifying meta title...');
    const pageTitle = await publicPage.title();
    const metaTitle = await publicPage.locator('meta[property="og:title"]').first().getAttribute('content');

    console.log(`   Page title: ${pageTitle}`);
    console.log(`   OG meta title: ${metaTitle}`);
    console.log(`   Expected: ${testSeoTitle}`);

    // Verify SEO title is applied
    const titleMatches = pageTitle.includes(testSeoTitle) || metaTitle?.includes(testSeoTitle);
    expect(titleMatches, `Expected title to contain "${testSeoTitle}"`).toBeTruthy();

    console.log('7. Test PASSED - SEO title update works!');

    await adminContext.close();
    await publicContext.close();
  });
});
