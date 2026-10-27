// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Same SETTINGS_OVERRIDE as src/lib/settings.ts, read here for the site URL.
const settingsFile = process.env.SETTINGS_OVERRIDE ?? './src/content/settings.json';
const { siteUrl } = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

export default defineConfig({
  site: siteUrl,
  output: 'static',
  outDir: process.env.ASTRO_OUT_DIR ?? './dist',
  // sobre.html is served at /sobre on Cloudflare Pages: one canonical URL per page, no trailing slash.
  trailingSlash: 'never',
  build: { format: 'file' },
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
});
