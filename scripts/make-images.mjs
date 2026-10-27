// Renders the share image (public/og-default.png, 1200×630) and public/apple-touch-icon.png
// with the brand fonts and colors. Run after changing the name or tagline: npm run images
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'src/content/site.pt-BR.json'), 'utf8'));
const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
const fontUrl = (pkg, file) =>
  'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'node_modules', pkg, 'files', file)).toString('base64');
const fonts = `
  @font-face { font-family: 'Fraunces Variable'; src: url(${fontUrl('@fontsource-variable/fraunces', 'fraunces-latin-wght-normal.woff2')}); font-weight: 100 900; }
  @font-face { font-family: 'DM Sans Variable'; src: url(${fontUrl('@fontsource-variable/dm-sans', 'dm-sans-latin-wght-normal.woff2')}); font-weight: 100 1000; }`;
const star = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 1.5c.6 5.4 3.1 9.9 10.5 10.5-7.4.6-9.9 5.1-10.5 10.5C11.4 17.1 8.9 12.6 1.5 12c7.4-.6 9.9-5.1 10.5-10.5Z" fill="var(--color-gold)"/></svg>`;
const escape = (s) => s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

const og = `<html><head><style>${tokens}${fonts}
  body { margin:0; width:1200px; height:630px; display:grid; place-items:center; color:var(--color-ink);
    background: linear-gradient(165deg, var(--color-sunset) 0%, var(--color-lavender) 45%, var(--color-bg) 100%); font-family: var(--font-body); }
  .wrap { text-align:center; }
  .name { font-family: var(--font-heading); font-size: 150px; font-weight: 600; line-height: 1; display:flex; align-items:flex-start; gap: 16px; justify-content:center; }
  .tag { font-family: var(--font-heading); font-style: italic; font-size: 54px; color: var(--color-ink); margin-top: 8px; }
  .line { font-size: 30px; margin-top: 36px; }
  .wave { position:absolute; left:0; right:0; bottom:0; height:40px; background-color: var(--color-bg);
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 24'%3E%3Cpath d='M0 12c6 0 6-9 12-9s6 9 12 9 6 9 12 9 6-9 12-9' fill='none' stroke='%237A5A43' stroke-opacity='.5' stroke-width='2.5'/%3E%3C/svg%3E");
    background-size: 64px 32px; background-repeat: repeat-x; background-position:center; }
</style></head><body><div class="wrap">
  <div class="name">${escape(content.meta.siteName)}${star(48)}</div>
  <div class="tag">${escape(content.meta.tagline)}</div>
  <div class="line">${escape(content.home.session.name)}</div>
</div><div class="wave"></div></body></html>`;

const icon = `<html><head><style>${tokens}${fonts}
  body { margin:0; width:180px; height:180px; display:grid; place-items:center; background: var(--color-forest); }
</style></head><body>${star(120)}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [html, size, out] of [
  [og, { width: 1200, height: 630 }, 'public/og-default.png'],
  [icon, { width: 180, height: 180 }, 'public/apple-touch-icon.png'],
]) {
  await page.setViewportSize(size);
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, out) });
  console.log(`wrote ${out}`);
}
await browser.close();
