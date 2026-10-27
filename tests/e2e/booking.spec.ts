import { expect, test } from '@playwright/test';
import { CAL_LINK, blockCal, fakeCal } from './helpers';

test.describe('home: inline calendar', () => {
  test('"Agendar leitura" scrolls to the booking section, which loads the calendar', async ({ page }) => {
    await fakeCal(page);
    await page.goto('/');
    await page.locator('.hero [data-book-button]').click();
    await expect(page).toHaveURL(/#agendar$/);
    await expect(page.locator('#agendar h2')).toBeInViewport();

    const shell = page.locator('[data-cal-inline]');
    await expect(shell).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('[data-cal-fallback]')).toBeHidden();

    const calls = await page.evaluate(() => window.__calCalls ?? []);
    const inline = calls.find((c) => c[0] === 'inline') as [string, { calLink: string; config: object }];
    expect(inline[1].calLink).toBe(CAL_LINK);
    expect(inline[1].config).toMatchObject({ layout: 'month_view', theme: 'light' });
    const ui = calls.find((c) => c[0] === 'ui') as [string, { cssVarsPerTheme: { light: Record<string, string> } }];
    expect(ui[1].cssVarsPerTheme.light['cal-brand']).toBe('#4e6b4a');
  });

  test('does not load Cal.com before the booking section is near', async ({ page }) => {
    let requested = false;
    await page.route('https://app.cal.com/**', (route) => {
      requested = true;
      return route.abort();
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(requested).toBe(false);
  });

  test('shows the "Abrir agenda" link when Cal.com fails to load', async ({ page }) => {
    await blockCal(page);
    await page.goto('/#agendar');
    await expect(page.locator('[data-cal-inline]')).toHaveAttribute('data-state', 'failed');
    const fallback = page.locator('[data-cal-fallback] a');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveText('Abrir agenda');
    await expect(fallback).toHaveAttribute('href', `https://cal.com/${CAL_LINK}`);
  });
});

test.describe('other pages: popup', () => {
  test('"Agendar leitura" opens the Cal.com popup', async ({ page }) => {
    await fakeCal(page);
    await page.goto('/sobre');
    await page.locator('[data-book-button]:visible').first().click();
    await expect
      .poll(async () => (await page.evaluate(() => window.__calCalls ?? [])).find((c) => c[0] === 'modal'))
      .toEqual(['modal', { calLink: CAL_LINK, config: { layout: 'month_view', theme: 'light' } }]);
    await expect(page).toHaveURL(/\/sobre$/);
  });

  test('falls back to the cal.com page when the embed fails', async ({ page }) => {
    await blockCal(page);
    await page.goto('/contato');
    await page.locator('[data-book-button]:visible').first().click();
    await expect(page).toHaveURL(`https://cal.com/${CAL_LINK}`);
  });

  test('without JavaScript, the button is a plain link to cal.com', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:4321/sobre');
    await expect(page.locator('[data-book-button]').first()).toHaveAttribute('href', `https://cal.com/${CAL_LINK}`);
    await context.close();
  });
});
