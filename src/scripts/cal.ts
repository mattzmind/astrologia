// Cal.com embed, loaded on demand so it never blocks first paint.
// Inline calendar on the home page; popup ("modal") from booking buttons elsewhere.
// If the embed script fails or is too slow, the plain cal.com link still works.

const EMBED_SRC = 'https://app.cal.com/embed/embed.js';
const ORIGIN = 'https://app.cal.com';
const NAMESPACE = 'leitura';
const TIMEOUT_MS = 8000;

type CalApi = ((...args: unknown[]) => void) & { q?: unknown[][] };
type CalGlobal = CalApi & { ns: Record<string, CalApi>; loaded?: boolean };

declare global {
  interface Window {
    Cal?: CalGlobal;
  }
}

let loading: Promise<void> | undefined;

/** Install Cal's queueing stub (same behaviour as the official snippet) and load embed.js once. */
export function loadCal(): Promise<void> {
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    if (!window.Cal) {
      const cal = function (...args: unknown[]) {
        if (args[0] === 'init' && typeof args[1] === 'string') {
          const namespace = args[1];
          const api: CalApi = (...a: unknown[]) => api.q!.push(a);
          api.q = [];
          cal.ns[namespace] ??= api;
          cal.ns[namespace].q?.push(args);
          cal.q!.push(['initNamespace', namespace]);
          return;
        }
        cal.q!.push(args);
      } as CalGlobal;
      cal.ns = {};
      cal.q = [];
      cal.loaded = true;
      window.Cal = cal;
    }
    const script = document.createElement('script');
    script.src = EMBED_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Cal.com embed failed to load'));
    document.head.appendChild(script);
    window.Cal('init', NAMESPACE, { origin: ORIGIN });
  });
  return loading;
}

const api = () => window.Cal!.ns[NAMESPACE];

const embedConfig = () => ({ layout: 'month_view', theme: 'light' });

function applyTheme() {
  const brand = getComputedStyle(document.documentElement).getPropertyValue('--color-forest').trim();
  api()('ui', { theme: 'light', layout: 'month_view', cssVarsPerTheme: { light: { 'cal-brand': brand } } });
}

/** Inline calendar: starts loading when the booking section approaches the viewport. */
export function mountInline(shell: HTMLElement) {
  const calLink = shell.dataset.calInline;
  const target = shell.querySelector<HTMLElement>('[data-cal-target]');
  if (!calLink || !target) return;

  const start = () => {
    shell.dataset.state = 'loading';
    const timer = window.setTimeout(() => (shell.dataset.state = 'failed'), TIMEOUT_MS);
    loadCal()
      .then(() => {
        api()('on', {
          action: 'linkReady',
          callback: () => {
            window.clearTimeout(timer);
            shell.dataset.state = 'ready';
          },
        });
        api()('inline', { elementOrSelector: target, calLink, config: embedConfig() });
        applyTheme();
      })
      .catch(() => {
        window.clearTimeout(timer);
        shell.dataset.state = 'failed';
      });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        start();
      }
    },
    { rootMargin: '600px 0px' },
  );
  observer.observe(shell);
}

/** Booking buttons outside the home page open Cal's popup; their href is the plain cal.com page. */
export function bindPopupButtons(root: ParentNode = document) {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-cal-popup]')) {
    if (link.dataset.bound) continue;
    link.dataset.bound = 'true';

    const warm = () => void loadCal().catch(() => {});
    link.addEventListener('pointerenter', warm, { once: true });
    link.addEventListener('touchstart', warm, { once: true, passive: true });
    link.addEventListener('focus', warm, { once: true });

    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      let settled = false;
      const fallback = () => {
        if (settled) return;
        settled = true;
        window.location.href = link.href;
      };
      const timer = window.setTimeout(fallback, TIMEOUT_MS);
      loadCal()
        .then(() => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          applyTheme();
          api()('modal', { calLink: link.dataset.calPopup, config: embedConfig() });
        })
        .catch(() => {
          window.clearTimeout(timer);
          fallback();
        });
    });
  }
}
