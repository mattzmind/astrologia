import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, fakeCal, watchErrors } from './helpers';

test.beforeEach(async ({ page }) => fakeCal(page));

for (const path of PAGES) {
  test.describe(`page ${path}`, () => {
    test('renders in Portuguese with one h1 and no errors', async ({ page }) => {
      const errors = watchErrors(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('footer')).toContainText('não substituem orientação médica');
      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
    });

    test('has no horizontal scroll', async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('keeps "Agendar leitura" one tap away, even after scrolling', async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      const visibleBook = page.locator('[data-book-button]:visible').filter({ hasText: 'Agendar leitura' });
      await expect(async () => {
        const inView = await Promise.all((await visibleBook.all()).map((l) => l.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0;
        })));
        expect(inView).toContain(true);
      }).toPass();
    });

    test('has no serious accessibility violations', async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });

    test('has share tags with an absolute image and a Portuguese title', async ({ page }) => {
      await page.goto(path);
      const og = (p: string) => page.locator(`meta[property="og:${p}"]`).getAttribute('content');
      expect(await og('image')).toMatch(/^https:\/\/.+\/og-default\.png$/);
      expect(await og('title')).toBe(await page.title());
      expect(await og('locale')).toBe('pt_BR');
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
    });

    test('emits no hreflang or language switcher while English is off', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('link[hreflang]')).toHaveCount(0);
      await expect(page.locator('[data-lang-switch]')).toHaveCount(0);
    });
  });
}

test('marks the current page in the nav', async ({ page }) => {
  await page.goto('/sobre');
  await expect(page.locator('.main-nav a[aria-current="page"]')).toHaveText('Sobre');
});

test('hides unfilled placeholders in the production build', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText('PREENCHER');
  }
  // the testimonials section has only placeholder quotes, so it is not rendered at all
  await page.goto('/');
  await expect(page.locator('#depoimentos')).toHaveCount(0);
});

test('FAQ answers open with the keyboard', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit does not tab to <summary> by default');
  await page.goto('/');
  const first = page.locator('.faq details').first();
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('open', '');
});

test('serves robots.txt and a sitemap with every page', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://gabby-teste.example/sitemap-index.xml');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const path of ['/', '/sobre', '/contato', '/privacidade']) {
    expect(sitemap).toContain(`<loc>https://gabby-teste.example${path}</loc>`);
  }
  expect(sitemap).not.toContain('/en');
});

test('unknown pages show the 404 page', async ({ page }) => {
  const response = await page.goto('/nao-existe');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toBeVisible();
});
