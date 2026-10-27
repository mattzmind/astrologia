import type { Page } from '@playwright/test';

export const PAGES = ['/', '/sobre', '/contato', '/privacidade'] as const;
export const CAL_LINK = 'gabby-teste/leitura'; // tests/fixtures/settings.json

declare global {
  interface Window {
    __calCalls?: unknown[][];
  }
}

// Stand-in for app.cal.com/embed/embed.js: replays the queue, records every call
// in window.__calCalls, and fires linkReady like the real embed does.
const FAKE_EMBED = `
(function () {
  var stub = window.Cal || { q: [], ns: {} };
  var calls = (window.__calCalls = []);
  function api() {
    var args = Array.prototype.slice.call(arguments);
    calls.push(args);
    if (args[0] === 'on' && args[1] && args[1].action === 'linkReady') setTimeout(args[1].callback, 20);
  }
  var Cal = function () { calls.push(Array.prototype.slice.call(arguments)); };
  Cal.ns = { leitura: api };
  Cal.loaded = true;
  window.Cal = Cal;
  (stub.q || []).forEach(function (a) { Cal.apply(null, a); });
  Object.keys(stub.ns || {}).forEach(function (k) { (stub.ns[k].q || []).forEach(function (a) { api.apply(null, a); }); });
})();`;

export async function fakeCal(page: Page) {
  await page.route('https://app.cal.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_EMBED }),
  );
}

export async function blockCal(page: Page) {
  await page.route('https://app.cal.com/**', (route) => route.abort());
  await page.route('https://cal.com/**', (route) => route.fulfill({ body: 'cal.com page' }));
}

/** Collect console errors and uncaught exceptions for the page's lifetime. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}
