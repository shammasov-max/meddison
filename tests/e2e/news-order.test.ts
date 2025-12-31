import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

test.describe('News Lists Reversed Order', () => {
  test('Public /news page shows newest first', async ({ page }) => {
    await page.goto(`${BASE_URL}/news`);
    await page.waitForSelector('.grid h3');
    
    const titles = await page.$$eval('.grid h3', els => els.map(e => e.textContent?.trim()));
    console.log('News page order:', titles);
    
    // After reversal, "Новогодняя вечеринка 2026" (last in data.json) should be first
    expect(titles[0]).toContain('Новогодняя вечеринка 2026');
  });

  test('Admin /admin/news shows newest first', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/news`);
    await page.waitForSelector('table tbody tr');
    
    const titles = await page.$$eval('table tbody tr td:nth-child(2)', 
      els => els.map(e => e.textContent?.trim()));
    console.log('Admin news order:', titles);
    
    // After reversal, "Новогодняя вечеринка 2026" should be first
    expect(titles[0]).toContain('Новогодняя вечеринка 2026');
  });

  test('Admin /admin/seo news block shows newest first', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/seo`);

    // Click to expand news section
    await page.click('button:has-text("Новости")');
    await page.waitForTimeout(500);

    // Get all h3 titles
    const allTitles = await page.$$eval('h3',
      els => els.map(e => e.textContent?.trim()));
    console.log('Admin SEO all titles:', allTitles);

    // Filter only news articles (not section headers)
    const newsItems = allTitles.filter(t =>
      t && !['Главная', 'Новости', 'Политика конфиденциальности', 'Лояльность'].includes(t)
    );
    console.log('Admin SEO news items:', newsItems);

    // After reversal, newest should be first
    expect(newsItems[0]).toContain('Новогодняя вечеринка 2026');
  });
});
