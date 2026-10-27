import { defineConfig, devices } from '@playwright/test';

// Two static builds made by `npm run build:test` and `npm run build:i18n`:
//   :4321 → dist-test  (Portuguese only, fake but valid links from tests/fixtures/settings.json)
//   :4322 → dist-i18n  (same + the stub English file from tests/fixtures/content)
const preview = (dir: string, port: number) => ({
  command: `node scripts/serve-static.mjs ${dir} ${port}`,
  url: `http://localhost:${port}/`,
  reuseExistingServer: !process.env.CI,
  timeout: 60_000,
});

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  webServer: [preview('dist-test', 4321), preview('dist-i18n', 4322)],
  projects: [
    {
      name: 'mobile-360-chromium',
      testIgnore: /i18n\.spec/,
      use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } },
    },
    { name: 'mobile-iphone-webkit', testIgnore: /i18n\.spec/, use: { ...devices['iPhone 13'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
