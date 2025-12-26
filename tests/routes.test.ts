import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://127.0.0.1:5173';

interface TestResult {
  route: string;
  status: 'pass' | 'fail';
  title?: string;
  errors: string[];
  loadTime: number;
}

async function testRoute(page: Page, path: string, expectedContent?: string): Promise<TestResult> {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  const startTime = Date.now();

  // Collect console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    const response = await page.goto(`${BASE_URL}${path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const loadTime = Date.now() - startTime;

    if (!response) {
      return { route: path, status: 'fail', errors: ['No response received'], loadTime };
    }

    if (response.status() >= 400) {
      errors.push(`HTTP ${response.status()}`);
    }

    const title = await page.title();

    // Check for expected content if provided
    if (expectedContent) {
      const bodyText = await page.textContent('body');
      if (!bodyText?.includes(expectedContent)) {
        errors.push(`Expected content not found: "${expectedContent}"`);
      }
    }

    // Add console errors
    if (consoleErrors.length > 0) {
      errors.push(...consoleErrors.map((e) => `Console: ${e}`));
    }

    return {
      route: path,
      status: errors.length === 0 ? 'pass' : 'fail',
      title,
      errors,
      loadTime,
    };
  } catch (error) {
    return {
      route: path,
      status: 'fail',
      errors: [`Navigation error: ${error}`],
      loadTime: Date.now() - startTime,
    };
  }
}

async function runTests() {
  console.log('🚀 Starting route tests...\n');

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: TestResult[] = [];

  // ==================== PUBLIC ROUTES ====================
  console.log('📄 Testing Public Routes...\n');

  // Home page
  results.push(await testRoute(page, '/', 'Medisson'));
  console.log(`  ${results.at(-1)?.status === 'pass' ? '✅' : '❌'} / (Home)`);

  // News listing
  results.push(await testRoute(page, '/news', 'Новости'));
  console.log(`  ${results.at(-1)?.status === 'pass' ? '✅' : '❌'} /news (News listing)`);

  // News detail pages
  const newsRoutes = [
    { path: '/news/grand-opening-ramenki', name: 'Grand Opening' },
    { path: '/news/medisson-loyalty', name: 'Loyalty Program' },
    { path: '/news/tea-gift', name: 'Tea Gift' },
    { path: '/news/aperol-wednesday', name: 'Aperol Wednesday' },
  ];

  for (const route of newsRoutes) {
    results.push(await testRoute(page, route.path));
    console.log(`  ${results.at(-1)?.status === 'pass' ? '✅' : '❌'} ${route.path} (${route.name})`);
  }

  // Location pages
  const locationRoutes = [
    { path: '/lounge/butovo', name: 'Butovo location' },
    { path: '/lounge/select', name: 'Select Ramenki location' },
  ];

  for (const route of locationRoutes) {
    results.push(await testRoute(page, route.path));
    console.log(`  ${results.at(-1)?.status === 'pass' ? '✅' : '❌'} ${route.path} (${route.name})`);
  }

  // Legacy redirects
  console.log('\n🔀 Testing Redirects...\n');

  // /butovo should redirect to /lounge/butovo
  await page.goto(`${BASE_URL}/butovo`, { waitUntil: 'networkidle' });
  const butovtUrl = page.url();
  const butovtResult: TestResult = {
    route: '/butovo → /lounge/butovo',
    status: butovtUrl.includes('/lounge/butovo') ? 'pass' : 'fail',
    errors: butovtUrl.includes('/lounge/butovo') ? [] : [`Redirected to ${butovtUrl}`],
    loadTime: 0,
  };
  results.push(butovtResult);
  console.log(`  ${butovtResult.status === 'pass' ? '✅' : '❌'} /butovo → /lounge/butovo`);

  // /select should redirect to /lounge/select
  await page.goto(`${BASE_URL}/select`, { waitUntil: 'networkidle' });
  const selectUrl = page.url();
  const selectResult: TestResult = {
    route: '/select → /lounge/select',
    status: selectUrl.includes('/lounge/select') ? 'pass' : 'fail',
    errors: selectUrl.includes('/lounge/select') ? [] : [`Redirected to ${selectUrl}`],
    loadTime: 0,
  };
  results.push(selectResult);
  console.log(`  ${selectResult.status === 'pass' ? '✅' : '❌'} /select → /lounge/select`);

  // Static pages
  console.log('\n📜 Testing Static Pages...\n');

  results.push(await testRoute(page, '/privacy', 'Политика'));
  console.log(`  ${results.at(-1)?.status === 'pass' ? '✅' : '❌'} /privacy (Privacy Policy)`);

  results.push(await testRoute(page, '/loyalty', 'Лояльности'));
  console.log(`  ${results.at(-1)?.status === 'pass' ? '✅' : '❌'} /loyalty (Loyalty Program)`);

  // ==================== ADMIN ROUTES ====================
  console.log('\n🔐 Testing Admin Routes...\n');

  // /admin should redirect to /admin/dashboard
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  const adminUrl = page.url();
  const adminRedirectResult: TestResult = {
    route: '/admin → /admin/dashboard',
    status: adminUrl.includes('/admin/dashboard') ? 'pass' : 'fail',
    errors: adminUrl.includes('/admin/dashboard') ? [] : [`Redirected to ${adminUrl}`],
    loadTime: 0,
  };
  results.push(adminRedirectResult);
  console.log(`  ${adminRedirectResult.status === 'pass' ? '✅' : '❌'} /admin → /admin/dashboard`);

  const adminRoutes = [
    { path: '/admin/dashboard', name: 'Dashboard', content: 'Панель' },
    { path: '/admin/locations', name: 'Locations', content: 'Локации' },
    { path: '/admin/news', name: 'News', content: 'Новости' },
    { path: '/admin/content', name: 'Content', content: 'Контент' },
    { path: '/admin/seo', name: 'SEO', content: 'SEO' },
    { path: '/admin/booking-settings', name: 'Booking Settings', content: 'Бронирование' },
  ];

  for (const route of adminRoutes) {
    results.push(await testRoute(page, route.path, route.content));
    console.log(`  ${results.at(-1)?.status === 'pass' ? '✅' : '❌'} ${route.path} (${route.name})`);
  }

  await browser.close();

  // ==================== SUMMARY ====================
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
      console.log(`  ${result.route}`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }
  }

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
