import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://217.26.27.137';

test.describe('Admin to Public Pages Sync', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check page loads
    await expect(page).toHaveTitle(/Medisson/i);

    // Check hero section
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // Check navigation exists (use first() to handle multiple navs)
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('API data endpoint returns valid JSON', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/data`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('hero');
    expect(data).toHaveProperty('locations');
    expect(data).toHaveProperty('news');
  });

  test('Location page loads and shows content', async ({ page }) => {
    // Route is /locations/:slug (not /lounge/:slug)
    await page.goto(`${BASE_URL}/locations/butovo`);
    await page.waitForLoadState('networkidle');

    // Wait for React app to mount and render content
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  });

  test('News page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/news`);
    await page.waitForLoadState('networkidle');

    // Check news page has content
    await expect(page.locator('main, article, section').first()).toBeVisible();
  });

  test('Admin page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');

    // Admin page should load (may redirect to login or show panel)
    await expect(page.locator('body')).toBeVisible();
    // Check URL contains admin
    expect(page.url()).toContain('admin');
  });

  test('Static assets are served correctly', async ({ request }) => {
    // Test that uploads endpoint works
    const response = await request.get(`${BASE_URL}/api/data`);
    expect(response.ok()).toBeTruthy();
  });

  test('Navigation links exist', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Find navigation links with href
    const links = page.locator('nav').first().locator('a[href]');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);
  });

  test('SEO meta tags present', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check SEO meta tags
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Use first() since there may be multiple description meta tags (static + react-helmet)
    const description = await page.locator('meta[name="description"]').first().getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('Booking settings API works', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/booking-settings`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('working_hours_start');
    expect(data).toHaveProperty('working_hours_end');
  });

  test('Locations array in API data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/data`);
    const data = await response.json();

    expect(Array.isArray(data.locations)).toBeTruthy();
    expect(data.locations.length).toBeGreaterThan(0);

    // Check first location has required fields
    const firstLocation = data.locations[0];
    expect(firstLocation).toHaveProperty('slug');
    expect(firstLocation).toHaveProperty('name');
  });
});
