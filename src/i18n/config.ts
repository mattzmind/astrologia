// Every locale the site knows how to build. Which ones are actually built is
// controlled by `enabledLocales` in src/content/settings.json.
export const LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt-BR';

export const PAGE_KEYS = ['home', 'about', 'contact', 'privacy'] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** URL prefix for a locale; the default locale lives at the root. */
export const localePrefix = (locale: Locale) => (locale === DEFAULT_LOCALE ? '' : locale.toLowerCase());

/** Build a site path from a locale and a page slug: ('pt-BR','sobre') → /sobre, ('en','') → /en */
export function buildPath(locale: Locale, slug: string): string {
  const parts = [localePrefix(locale), slug].filter(Boolean);
  return '/' + parts.join('/');
}

/**
 * Locales to build: the requested ones (env override wins over settings), in LOCALES order,
 * always including the default. Fails loudly if a requested locale has no content file.
 */
export function resolveEnabledLocales(
  configured: readonly string[],
  available: readonly string[],
  envOverride?: string,
): Locale[] {
  const requested = envOverride
    ? envOverride.split(',').map((s) => s.trim()).filter(Boolean)
    : configured;
  const unknown = requested.filter((l) => !isLocale(l));
  if (unknown.length) throw new Error(`Idioma desconhecido em enabledLocales: ${unknown.join(', ')}`);
  const result = LOCALES.filter((l) => l === DEFAULT_LOCALE || requested.includes(l));
  for (const locale of result) {
    if (!available.includes(locale)) {
      throw new Error(`O idioma "${locale}" está ativado, mas falta o arquivo src/content/site.${locale}.json`);
    }
  }
  return result;
}
