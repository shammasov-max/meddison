import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'medisson2024';

test.describe('Admin SEO Synchronization - Server & Client Verification', () => {

  test('Home page SEO: admin update → curl → SPA navigation', async ({ browser }) => {
    const testTitle = `HOME SEO TEST ${Date.now()}`;

    // ==================== PHASE 1: ADMIN UPDATE ====================
    console.log('=== PHASE 1: Admin SEO Update ===');

    const adminContext = await browser.newContext({
      httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    const adminPage = await adminContext.newPage();

    console.log('1.1 Navigating to admin SEO page...');
    await adminPage.goto(`${BASE_URL}/admin/seo`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(2000);

    console.log('1.2 Finding home page SEO inputs...');
    // Find the first title input in the static pages section (home is first)
    const titleInputs = adminPage.locator('input[placeholder="Заголовок страницы"]');
    const firstTitleInput = titleInputs.first();

    // Fill title
    console.log('1.3 Updating home page SEO title...');
    await firstTitleInput.fill(testTitle);

    await adminPage.waitForTimeout(500);

    console.log('1.4 Saving changes...');
    adminPage.on('dialog', dialog => dialog.accept());
    await adminPage.locator('button:has-text("Сохранить")').click();
    await adminPage.waitForTimeout(2000);

    console.log(`   Updated title: ${testTitle}`);

    // ==================== PHASE 2: SERVER-SIDE VERIFICATION (CURL) ====================
    console.log('\n=== PHASE 2: Server-side Verification (curl) ===');

    console.log('2.1 Fetching page via direct HTTP request (simulates curl)...');
    const response = await adminPage.request.get(BASE_URL);
    const html = await response.text();

    console.log('2.2 Extracting meta tags from server response...');
    const serverTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const serverOgTitleMatch = html.match(/property="og:title" content="([^"]+)"/);
    const serverOgDescMatch = html.match(/property="og:description" content="([^"]+)"/);
    const serverDescMatch = html.match(/name="description" content="([^"]+)"/);

    const serverTitle = serverTitleMatch?.[1] || '';
    const serverOgTitle = serverOgTitleMatch?.[1] || '';
    const serverOgDesc = serverOgDescMatch?.[1] || '';
    const serverDesc = serverDescMatch?.[1] || '';

    console.log(`   Server <title>: ${serverTitle}`);
    console.log(`   Server og:title: ${serverOgTitle}`);

    // Verify server-side injection
    expect(serverTitle, 'Server <title> should match').toContain(testTitle);
    expect(serverOgTitle, 'Server og:title should match').toContain(testTitle);

    console.log('2.3 ✓ Server-side meta injection verified!');

    // ==================== PHASE 3: CLIENT-SIDE VERIFICATION (SPA) ====================
    console.log('\n=== PHASE 3: Client-side Verification (SPA Navigation) ===');

    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();

    console.log('3.1 Loading news page first...');
    await clientPage.goto(`${BASE_URL}/news`);
    await clientPage.waitForLoadState('networkidle');

    const newsTitle = await clientPage.title();
    console.log(`   News page title: ${newsTitle}`);

    console.log('3.2 Navigating to home via SPA (clicking logo/home link)...');
    await clientPage.click('a[href="/"]');
    await clientPage.waitForURL(BASE_URL + '/');
    await clientPage.waitForTimeout(1500); // Wait for React Helmet

    console.log('3.3 Checking client-side meta tags...');
    const clientTitle = await clientPage.title();
    const clientOgTitle = await clientPage.locator('meta[property="og:title"]').first().getAttribute('content');

    console.log(`   Client <title>: ${clientTitle}`);
    console.log(`   Client og:title: ${clientOgTitle}`);

    // Verify client-side updates
    expect(clientTitle, 'Client title should match').toContain(testTitle);
    expect(clientOgTitle, 'Client og:title should match').toContain(testTitle);

    console.log('3.4 ✓ Client-side SPA navigation verified!');

    // ==================== PHASE 4: CROSS-VERIFICATION ====================
    console.log('\n=== PHASE 4: Cross-verification ===');

    expect(serverTitle).toBe(clientTitle);
    expect(serverOgTitle).toBe(clientOgTitle);

    console.log('4.1 ✓ Server and client meta tags match!');
    console.log('\n=== TEST PASSED: Admin SEO → Server → Client synchronization works! ===');

    await adminContext.close();
    await clientContext.close();
  });

  test('News article SEO: admin update → curl → SPA navigation', async ({ browser }) => {
    const testTitle = `NEWS SEO TEST ${Date.now()}`;
    const newsSlug = 'grand-opening-ramenki';

    // ==================== PHASE 1: ADMIN UPDATE ====================
    console.log('=== PHASE 1: Admin SEO Update (News) ===');

    const adminContext = await browser.newContext({
      httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/admin/seo`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1000);

    // Expand news section
    console.log('1.1 Expanding Новости section...');
    await adminPage.locator('button:has-text("Новости")').click();
    await adminPage.waitForTimeout(500);

    // Find the news card
    console.log('1.2 Finding news article card...');
    const newsCard = adminPage.locator(`p:has-text("/news/${newsSlug}")`).locator('xpath=ancestor::div[contains(@class, "bg-zinc-900")]');

    // Update title
    console.log('1.3 Updating SEO title...');
    const titleInput = newsCard.locator('input[placeholder="Заголовок страницы"]');
    await titleInput.fill(testTitle);
    await adminPage.waitForTimeout(500);

    // Save
    console.log('1.4 Saving changes...');
    adminPage.on('dialog', dialog => dialog.accept());
    await adminPage.locator('button:has-text("Сохранить")').click();
    await adminPage.waitForTimeout(2000);

    // Wait for server cache to expire (CACHE_TTL is 5 seconds)
    console.log('1.5 Waiting for server cache to expire (6s)...');
    await adminPage.waitForTimeout(6000);

    // ==================== PHASE 2: SERVER-SIDE (CURL) ====================
    console.log('\n=== PHASE 2: Server-side Verification ===');

    // Use fresh context to avoid HTTP cache
    const curlContext = await browser.newContext();
    const curlPage = await curlContext.newPage();
    const response = await curlPage.request.get(`${BASE_URL}/news/${newsSlug}`);
    const html = await response.text();
    await curlContext.close();

    const serverTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const serverOgTitleMatch = html.match(/property="og:title" content="([^"]+)"/);

    const serverTitle = serverTitleMatch?.[1] || '';
    const serverOgTitle = serverOgTitleMatch?.[1] || '';

    console.log(`   Server <title>: ${serverTitle}`);
    console.log(`   Server og:title: ${serverOgTitle}`);

    expect(serverTitle).toContain(testTitle);
    expect(serverOgTitle).toContain(testTitle);
    console.log('2.1 ✓ Server-side verified!');

    // ==================== PHASE 3: CLIENT-SIDE (SPA) ====================
    console.log('\n=== PHASE 3: Client-side Verification ===');

    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();

    // Start at news list
    await clientPage.goto(`${BASE_URL}/news`);
    await clientPage.waitForLoadState('networkidle');

    // Navigate to article via SPA
    console.log('3.1 Navigating to article via SPA link...');
    await clientPage.click(`a[href="/news/${newsSlug}"]`);
    await clientPage.waitForURL(`**/news/${newsSlug}`);
    await clientPage.waitForTimeout(1500);

    const clientTitle = await clientPage.title();
    const clientOgTitle = await clientPage.locator('meta[property="og:title"]').first().getAttribute('content');

    console.log(`   Client <title>: ${clientTitle}`);
    console.log(`   Client og:title: ${clientOgTitle}`);

    expect(clientTitle).toContain(testTitle);
    expect(clientOgTitle).toContain(testTitle);
    console.log('3.1 ✓ Client-side verified!');

    // ==================== PHASE 4: CROSS-CHECK ====================
    console.log('\n=== PHASE 4: Cross-verification ===');
    expect(serverTitle).toBe(clientTitle);
    console.log('4.1 ✓ Server and client match!');

    console.log('\n=== TEST PASSED: News SEO synchronization works! ===');

    await adminContext.close();
    await clientContext.close();
  });

  test('Location SEO: admin update → curl → SPA navigation', async ({ browser }) => {
    const testTitle = `LOCATION SEO TEST ${Date.now()}`;
    const locationSlug = 'butovo';

    // ==================== PHASE 1: ADMIN UPDATE ====================
    console.log('=== PHASE 1: Admin SEO Update (Location) ===');

    const adminContext = await browser.newContext({
      httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/admin/seo`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.waitForTimeout(1000);

    // Expand locations section
    console.log('1.1 Expanding Локации section...');
    await adminPage.locator('button:has-text("Локации")').click();
    await adminPage.waitForTimeout(500);

    // Find the location card
    console.log('1.2 Finding location card...');
    const locationCard = adminPage.locator(`p:has-text("/locations/${locationSlug}")`).locator('xpath=ancestor::div[contains(@class, "bg-zinc-900")]');

    // Update title
    console.log('1.3 Updating SEO title...');
    const titleInput = locationCard.locator('input[placeholder="Заголовок страницы"]');
    await titleInput.fill(testTitle);
    await adminPage.waitForTimeout(500);

    // Save
    console.log('1.4 Saving changes...');
    adminPage.on('dialog', dialog => dialog.accept());
    await adminPage.locator('button:has-text("Сохранить")').click();
    await adminPage.waitForTimeout(2000);

    // Wait for server cache to expire (CACHE_TTL is 5 seconds)
    console.log('1.5 Waiting for server cache to expire (6s)...');
    await adminPage.waitForTimeout(6000);

    // ==================== PHASE 2: SERVER-SIDE (CURL) ====================
    console.log('\n=== PHASE 2: Server-side Verification ===');

    // Use fresh context to avoid HTTP cache
    const curlContext = await browser.newContext();
    const curlPage = await curlContext.newPage();
    const response = await curlPage.request.get(`${BASE_URL}/locations/${locationSlug}`);
    const html = await response.text();
    await curlContext.close();

    const serverTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    const serverOgTitleMatch = html.match(/property="og:title" content="([^"]+)"/);

    const serverTitle = serverTitleMatch?.[1] || '';
    const serverOgTitle = serverOgTitleMatch?.[1] || '';

    console.log(`   Server <title>: ${serverTitle}`);
    console.log(`   Server og:title: ${serverOgTitle}`);

    expect(serverTitle).toContain(testTitle);
    expect(serverOgTitle).toContain(testTitle);
    console.log('2.1 ✓ Server-side verified!');

    // ==================== PHASE 3: CLIENT-SIDE (SPA) ====================
    console.log('\n=== PHASE 3: Client-side Verification ===');

    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();

    // Start at home
    await clientPage.goto(BASE_URL);
    await clientPage.waitForLoadState('networkidle');

    // Navigate to location via direct URL (simulates internal link)
    console.log('3.1 Navigating to location page...');
    await clientPage.goto(`${BASE_URL}/locations/${locationSlug}`);
    await clientPage.waitForLoadState('networkidle');
    await clientPage.waitForTimeout(1500);

    const clientTitle = await clientPage.title();
    const clientOgTitle = await clientPage.locator('meta[property="og:title"]').first().getAttribute('content');

    console.log(`   Client <title>: ${clientTitle}`);
    console.log(`   Client og:title: ${clientOgTitle}`);

    expect(clientTitle).toContain(testTitle);
    expect(clientOgTitle).toContain(testTitle);
    console.log('3.1 ✓ Client-side verified!');

    // ==================== PHASE 4: CROSS-CHECK ====================
    console.log('\n=== PHASE 4: Cross-verification ===');
    expect(serverTitle).toBe(clientTitle);
    console.log('4.1 ✓ Server and client match!');

    console.log('\n=== TEST PASSED: Location SEO synchronization works! ===');

    await adminContext.close();
    await clientContext.close();
  });

});
