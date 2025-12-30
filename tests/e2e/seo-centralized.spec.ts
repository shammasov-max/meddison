import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'medisson2024';

test.describe('Centralized SEO Update via /admin/seo', () => {
  test('should update news SEO title from AdminSEO page', async ({ browser }) => {
    // Generate unique test value
    const testSeoTitle = `CENTRAL SEO ${Date.now()}`;
    const newsSlug = 'grand-opening-ramenki';

    // Tab 1: Admin SEO panel - update SEO fields
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

    // The "Страницы" tab should be selected by default, expand "Новости" section
    console.log('2. Expanding Новости section...');
    const newsSection = adminPage.locator('button:has-text("Новости")');
    await newsSection.click();
    await adminPage.waitForTimeout(500);

    // Find the news card by its URL and update the Meta Title
    console.log('3. Finding news article card...');
    const newsUrl = `/news/${newsSlug}`;
    const newsCard = adminPage.locator(`p:has-text("${newsUrl}")`).locator('xpath=ancestor::div[contains(@class, "bg-zinc-900")]');

    // Find the Meta Title input within this card
    console.log('4. Filling SEO title field...');
    const titleInput = newsCard.locator('input[placeholder="Заголовок страницы"]');
    await titleInput.fill(testSeoTitle);
    await adminPage.waitForTimeout(500);

    // Save the changes
    console.log('5. Saving changes...');
    adminPage.on('dialog', dialog => dialog.accept());
    await adminPage.locator('button:has-text("Сохранить")').click();
    await adminPage.waitForTimeout(2000);

    // Tab 2: Public page - verify meta tags
    console.log('6. Opening public news page...');
    const verifyContext = await browser.newContext();
    const verifyPage = await verifyContext.newPage();

    await verifyPage.goto(`${BASE_URL}/news/${newsSlug}`);
    await verifyPage.waitForLoadState('networkidle');

    // Check the page title or meta tag
    console.log('7. Verifying meta title...');
    const pageTitle = await verifyPage.title();
    const metaTitle = await verifyPage.locator('meta[property="og:title"]').first().getAttribute('content');

    console.log(`   Page title: ${pageTitle}`);
    console.log(`   OG meta title: ${metaTitle}`);
    console.log(`   Expected: ${testSeoTitle}`);

    // Verify SEO title is applied
    const titleMatches = pageTitle.includes(testSeoTitle) || metaTitle?.includes(testSeoTitle);
    expect(titleMatches, `Expected title to contain "${testSeoTitle}"`).toBeTruthy();

    console.log('8. Test PASSED - Centralized SEO update works!');

    await adminContext.close();
    await verifyContext.close();
  });
});
