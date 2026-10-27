import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    env: { CONTENT_FIXTURES_DIR: 'tests/fixtures/content' },
  },
});
