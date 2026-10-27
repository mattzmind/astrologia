import { expect, test } from '@playwright/test';
import { fakeCal } from './helpers';

// Runs against the dist-i18n build: the stub English file is added and 'en' is enabled.
// Proves English can be switched on without touching templates (SPEC 3a, acceptance #6).
test.use({ baseURL: 'http://localhost:4322' });
test.beforeEach(async ({ page }) => fakeCal(page));

const PAIRS = [
  ['/', '/en'],
  ['/sobre', '/en/about'],
  ['/contato', '/en/contact'],
  ['/privacidade', '/en/privacy'],
] as const;

for (const [pt, en] of PAIRS) {
  test(`${en} exists in English and links back to ${pt}`, async ({ page }) => {
    const response = await page.goto(en);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US');
    await expect(page.locator('[data-lang-switch]')).toHaveAttribute('href', pt);
  });

  test(`${pt} has hreflang alternates and a switcher to ${en}`, async ({ page }) => {
    await page.goto(pt);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    const switcher = page.locator('[data-lang-switch]');
    await expect(switcher).toHaveAttribute('href', en);
    await expect(switcher).toHaveText('EN');
    const alt = (lang: string) => page.locator(`link[rel="alternate"][hreflang="${lang}"]`);
    await expect(alt('pt-BR')).toHaveAttribute('href', `https://gabby-teste.example${pt}`);
    await expect(alt('en')).toHaveAttribute('href', `https://gabby-teste.example${en}`);
    await expect(alt('x-default')).toHaveAttribute('href', `https://gabby-teste.example${pt}`);
  });
}

test('English pages use English nav and booking anchors', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('.main-nav')).toContainText('About');
  await expect(page.locator('.hero [data-book-button]')).toHaveAttribute('href', '/en#book');
  await expect(page.locator('#book')).toHaveCount(1);
});

test('sitemap lists the English pages', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('<loc>https://gabby-teste.example/en/about</loc>');
});
