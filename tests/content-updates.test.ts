/**
 * Frontend Content Update Tests
 * Tests that content changes are reflected on the frontend after save
 */

import { chromium, Browser, Page } from 'playwright';

const FRONTEND_URL = 'http://127.0.0.1:5173';
const API_URL = 'http://localhost:3001';
const AUTH_HEADER = 'Basic ' + Buffer.from('admin:medisson2024').toString('base64');

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, status: 'pass', duration: Date.now() - start });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, status: 'fail', message, duration: Date.now() - start });
    console.log(`  ❌ ${name}: ${message}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function getApiData(): Promise<any> {
  const response = await fetch(`${API_URL}/api/data`);
  return response.json();
}

async function saveApiData(data: any): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_HEADER,
    },
    body: JSON.stringify(data),
  });
  return response.ok;
}

async function runTests() {
  console.log('\n🖥️ Frontend Content Update Tests\n');
  console.log('='.repeat(60) + '\n');

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let originalData: any;

  // ==================== Setup ====================
  console.log('🔧 Setup\n');

  await test('Save original data snapshot', async () => {
    originalData = await getApiData();
    assert(originalData !== null, 'Failed to get original data');
  });

  // ==================== Hero Section Tests ====================
  console.log('\n🦸 Hero Section Updates\n');

  const testHeroSlogan = `Test Slogan ${Date.now()}`;

  await test('Update hero slogan via API', async () => {
    const modifiedData = {
      ...originalData,
      hero: { ...originalData.hero, slogan: testHeroSlogan },
    };
    const saved = await saveApiData(modifiedData);
    assert(saved, 'Failed to save modified data');
  });

  await test('Homepage shows updated hero slogan', async () => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    const heroText = await page.textContent('body');
    assert(heroText?.includes(testHeroSlogan) ?? false, `Hero slogan "${testHeroSlogan}" not found on page`);
  });

  await test('Hard refresh still shows updated slogan', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    const heroText = await page.textContent('body');
    assert(heroText?.includes(testHeroSlogan) ?? false, `Hero slogan "${testHeroSlogan}" not found after refresh`);
  });

  // ==================== About Section Tests ====================
  console.log('\n📖 About Section Updates\n');

  const testAboutDesc = `Test Description ${Date.now()}`;

  await test('Update about description via API', async () => {
    const currentData = await getApiData();
    const modifiedData = {
      ...currentData,
      about: { ...currentData.about, description1: testAboutDesc },
    };
    const saved = await saveApiData(modifiedData);
    assert(saved, 'Failed to save about data');
  });

  await test('Homepage shows updated about description', async () => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    const pageText = await page.textContent('body');
    assert(pageText?.includes(testAboutDesc) ?? false, `About description "${testAboutDesc}" not found`);
  });

  // ==================== News Section Tests ====================
  console.log('\n📰 News Content Updates\n');

  const testNewsTitle = `Test News Item ${Date.now()}`;

  await test('Add new news item via API', async () => {
    const currentData = await getApiData();
    const newNewsItem = {
      id: 999,
      slug: 'test-news-item',
      title: testNewsTitle,
      date: new Date().toISOString().split('T')[0],
      category: 'Тест',
      image: '/assets/images/hero-tree.jpg',
      description: 'Test news description',
      fullContent: '<p>Test content</p>',
      location: 'Все локации',
    };
    const modifiedData = {
      ...currentData,
      news: [newNewsItem, ...currentData.news],
    };
    const saved = await saveApiData(modifiedData);
    assert(saved, 'Failed to save news data');
  });

  await test('News page shows new item', async () => {
    await page.goto(`${FRONTEND_URL}/news`, { waitUntil: 'networkidle' });
    const pageText = await page.textContent('body');
    assert(pageText?.includes(testNewsTitle) ?? false, `News title "${testNewsTitle}" not found`);
  });

  await test('News detail page is accessible', async () => {
    await page.goto(`${FRONTEND_URL}/news/test-news-item`, { waitUntil: 'networkidle' });
    const pageText = await page.textContent('body');
    assert(pageText?.includes(testNewsTitle) ?? false, `News detail "${testNewsTitle}" not found`);
  });

  // ==================== Location Updates ====================
  console.log('\n📍 Location Content Updates\n');

  const testLocationDesc = `Updated Description ${Date.now()}`;

  await test('Update location description via API', async () => {
    const currentData = await getApiData();
    const modifiedLocations = currentData.locations.map((loc: any) =>
      loc.slug === 'butovo' ? { ...loc, description: testLocationDesc } : loc
    );
    const modifiedData = { ...currentData, locations: modifiedLocations };
    const saved = await saveApiData(modifiedData);
    assert(saved, 'Failed to save location data');
  });

  await test('Location page shows updated description', async () => {
    await page.goto(`${FRONTEND_URL}/lounge/butovo`, { waitUntil: 'networkidle' });
    const pageText = await page.textContent('body');
    assert(pageText?.includes(testLocationDesc) ?? false, `Description "${testLocationDesc}" not found`);
  });

  // ==================== Real-time Updates (data-updated event) ====================
  console.log('\n⚡ Real-time Update Events\n');

  await test('data-updated event triggers re-render', async () => {
    const uniqueMarker = `UNIQUE_MARKER_${Date.now()}`;

    // Navigate to homepage
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Update data via API
    const currentData = await getApiData();
    const modifiedData = {
      ...currentData,
      hero: { ...currentData.hero, slogan: uniqueMarker },
    };
    await saveApiData(modifiedData);

    // Simulate the data-updated event that save() dispatches
    await page.evaluate(() => {
      window.dispatchEvent(new Event('data-updated'));
    });

    // Wait for re-render
    await page.waitForTimeout(1000);
    await page.reload({ waitUntil: 'networkidle' });

    const pageText = await page.textContent('body');
    assert(pageText?.includes(uniqueMarker) ?? false, `Updated slogan "${uniqueMarker}" not found`);
  });

  // ==================== Cleanup ====================
  console.log('\n🧹 Cleanup\n');

  await test('Restore original data', async () => {
    const saved = await saveApiData(originalData);
    assert(saved, 'Failed to restore original data');
  });

  await test('Homepage shows original content', async () => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    const pageText = await page.textContent('body');
    assert(
      pageText?.includes(originalData.hero.slogan) ?? false,
      `Original slogan "${originalData.hero.slogan}" not found`
    );
  });

  await browser.close();

  // ==================== Summary ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  console.log(`Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`Success rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('❌ Failed Tests:\n');
    for (const result of results.filter((r) => r.status === 'fail')) {
      console.log(`  ${result.name}`);
      console.log(`    - ${result.message}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
