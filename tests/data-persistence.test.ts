/**
 * Data Persistence Tests
 * Tests the backend API for save/load operations
 */

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

async function runTests() {
  console.log('\n🔧 Data Persistence Tests\n');
  console.log('='.repeat(60) + '\n');

  // ==================== API Connectivity ====================
  console.log('📡 API Connectivity\n');

  await test('GET /api/data returns 200', async () => {
    const response = await fetch(`${API_URL}/api/data`);
    assert(response.ok, `Expected 200, got ${response.status}`);
  });

  await test('GET /api/data returns valid JSON', async () => {
    const response = await fetch(`${API_URL}/api/data`);
    const data = await response.json();
    assert(typeof data === 'object', 'Expected object response');
    assert('hero' in data, 'Expected hero section');
    assert('locations' in data, 'Expected locations array');
    assert('news' in data, 'Expected news array');
  });

  // ==================== Authentication ====================
  console.log('\n🔐 Authentication\n');

  await test('POST without auth returns 401', async () => {
    const response = await fetch(`${API_URL}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  await test('POST with wrong credentials returns 401', async () => {
    const wrongAuth = 'Basic ' + Buffer.from('wrong:wrong').toString('base64');
    const response = await fetch(`${API_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: wrongAuth,
      },
      body: JSON.stringify({}),
    });
    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  await test('POST with correct auth is accepted', async () => {
    // First get current data
    const getData = await fetch(`${API_URL}/api/data`);
    const data = await getData.json();

    const response = await fetch(`${API_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify(data),
    });
    assert(response.ok, `Expected 200, got ${response.status}`);
  });

  // ==================== Data Persistence ====================
  console.log('\n💾 Data Persistence\n');

  let originalData: any;
  const testTitle = `Test Title ${Date.now()}`;

  await test('Save modified data succeeds', async () => {
    // Get current data
    const getData = await fetch(`${API_URL}/api/data`);
    originalData = await getData.json();

    // Modify hero title
    const modifiedData = { ...originalData, hero: { ...originalData.hero, title: testTitle } };

    const response = await fetch(`${API_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify(modifiedData),
    });
    assert(response.ok, `Save failed: ${response.status}`);
  });

  await test('Modified data persists after reload', async () => {
    const response = await fetch(`${API_URL}/api/data`);
    const data = await response.json();
    assert(data.hero.title === testTitle, `Expected "${testTitle}", got "${data.hero.title}"`);
  });

  await test('Restore original data succeeds', async () => {
    const response = await fetch(`${API_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify(originalData),
    });
    assert(response.ok, `Restore failed: ${response.status}`);
  });

  await test('Original data is restored', async () => {
    const response = await fetch(`${API_URL}/api/data`);
    const data = await response.json();
    assert(
      data.hero.title === originalData.hero.title,
      `Expected "${originalData.hero.title}", got "${data.hero.title}"`
    );
  });

  // ==================== CORS ====================
  console.log('\n🌐 CORS Headers\n');

  await test('OPTIONS request returns 204', async () => {
    const response = await fetch(`${API_URL}/api/data`, { method: 'OPTIONS' });
    assert(response.status === 204, `Expected 204, got ${response.status}`);
  });

  await test('CORS headers are present', async () => {
    const response = await fetch(`${API_URL}/api/data`);
    const corsOrigin = response.headers.get('access-control-allow-origin');
    assert(corsOrigin === '*', `Expected CORS header "*", got "${corsOrigin}"`);
  });

  // ==================== Error Handling ====================
  console.log('\n⚠️ Error Handling\n');

  await test('Invalid JSON returns 500', async () => {
    const response = await fetch(`${API_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: 'not valid json',
    });
    assert(response.status === 500, `Expected 500, got ${response.status}`);
  });

  await test('Unknown route returns 404', async () => {
    const response = await fetch(`${API_URL}/api/unknown`);
    assert(response.status === 404, `Expected 404, got ${response.status}`);
  });

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
