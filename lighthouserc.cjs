// Lighthouse CI (mobile preset by default) against the test build. Needs `npm run build:test` first.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/serve-static.mjs dist-test 4400',
      startServerReadyPattern: 'serving',
      url: ['/', '/sobre', '/contato', '/privacidade'].map((p) => `http://localhost:4400${p}`),
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
