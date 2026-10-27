import { expect, test } from '@playwright/test';
import { fakeCal } from './helpers';

test.beforeEach(async ({ page }) => fakeCal(page));

test('WhatsApp opens a chat with the prefilled greeting', async ({ page }) => {
  await page.goto('/contato');
  const href = await page.locator('[data-contact="whatsapp"]').getAttribute('href');
  const url = new URL(href!);
  expect(url.origin + url.pathname).toBe('https://wa.me/5521999999999');
  expect(url.searchParams.get('text')).toBe('Oi, Gabby! Vim pelo site e queria saber mais sobre a leitura. ✨');
});

test('Instagram opens a DM, with the profile as a secondary link', async ({ page }) => {
  await page.goto('/contato');
  await expect(page.locator('[data-contact="instagram"]')).toHaveAttribute('href', 'https://ig.me/m/gabby.teste');
  await expect(page.locator('[data-contact="instagram-profile"]')).toHaveAttribute(
    'href',
    'https://www.instagram.com/gabby.teste/',
  );
});

test('contact buttons are large tap targets', async ({ page }) => {
  await page.goto('/contato');
  for (const button of await page.locator('.contact-actions .btn').all()) {
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  }
});

test('home hero offers WhatsApp next to booking', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero a[href^="https://wa.me/"]')).toHaveText(/Falar no WhatsApp/);
});

test('footer links to Instagram, WhatsApp and the privacy page', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.locator('a[href="https://www.instagram.com/gabby.teste/"]')).toHaveCount(1);
  await expect(footer.locator('a[href^="https://wa.me/5521999999999"]')).toHaveCount(1);
  await footer.getByRole('link', { name: 'Privacidade' }).click();
  await expect(page).toHaveURL(/\/privacidade$/);
});

test('privacy page gives the LGPD contact email and a localized date', async ({ page }) => {
  await page.goto('/privacidade');
  await expect(page.locator('a[href="mailto:privacidade@gabby-teste.example"]')).toBeVisible();
  await expect(page.locator('.updated')).toContainText('de outubro de 2026');
});
