import fs from 'node:fs';
import path from 'node:path';
import { settings } from '../lib/settings';
import { DEFAULT_LOCALE, buildPath, isLocale, resolveEnabledLocales, type Locale, type PageKey } from './config';
import { parseOrExplain, siteContentSchema, type SiteContent } from './schema';

export * from './config';
export type { SiteContent };

const bundled = import.meta.glob<{ default: unknown }>('../content/site.*.json', { eager: true });

// CONTENT_FIXTURES_DIR adds or replaces locale files; the i18n test build uses it for a stub English file.
function loadContents(): Partial<Record<Locale, SiteContent>> {
  const out: Partial<Record<Locale, SiteContent>> = {};
  const add = (file: string, data: unknown) => {
    const locale = file.match(/site\.([\w-]+)\.json$/)?.[1];
    if (!isLocale(locale)) throw new Error(`${file}: idioma desconhecido no nome do arquivo`);
    out[locale] = parseOrExplain(siteContentSchema, data, file);
  };
  for (const [file, mod] of Object.entries(bundled)) add(file, mod.default);
  const dir = process.env.CONTENT_FIXTURES_DIR;
  if (dir) {
    for (const file of fs.readdirSync(dir).filter((f) => /^site\..+\.json$/.test(f))) {
      add(file, JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')));
    }
  }
  return out;
}

const contents = loadContents();

export const enabledLocales: Locale[] = resolveEnabledLocales(
  settings.enabledLocales,
  Object.keys(contents),
  process.env.ENABLE_LOCALES,
);

/** All text for a locale: `const c = t(locale); c.nav.about` */
export function t(locale: Locale): SiteContent {
  const content = contents[locale];
  if (!content) throw new Error(`Sem conteúdo para o idioma "${locale}"`);
  return content;
}

/** Replace {name} tokens: fmt('© {year}', { year: 2026 }) */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

export function localizedPath(locale: Locale, page: PageKey): string {
  return buildPath(locale, t(locale).routes[page]);
}

export function bookingHref(locale: Locale): string {
  const home = localizedPath(locale, 'home');
  return `${home === '/' ? '/' : home}#${t(locale).routes.bookingAnchor}`;
}

export const absoluteUrl = (pathname: string) => new URL(pathname, settings.siteUrl).href;

/** hreflang alternates for a page; empty while only one locale is enabled. */
export function alternates(page: PageKey, locales: readonly Locale[] = enabledLocales) {
  if (locales.length < 2) return [];
  const links = locales.map((locale) => ({ hreflang: locale, href: absoluteUrl(localizedPath(locale, page)) }));
  return [...links, { hreflang: 'x-default', href: absoluteUrl(localizedPath(DEFAULT_LOCALE, page)) }];
}

export function formatDate(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(isoDate));
}
