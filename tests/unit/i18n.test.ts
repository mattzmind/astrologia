import { describe, expect, it } from 'vitest';
import {
  alternates,
  bookingHref,
  buildPath,
  enabledLocales,
  fmt,
  formatDate,
  localizedPath,
  resolveEnabledLocales,
  t,
} from '../../src/i18n';

// vitest.config.ts sets CONTENT_FIXTURES_DIR, so the stub English file is loaded (but not enabled).

describe('buildPath', () => {
  it('serves the default locale at the root', () => {
    expect(buildPath('pt-BR', '')).toBe('/');
    expect(buildPath('pt-BR', 'sobre')).toBe('/sobre');
  });
  it('prefixes other locales', () => {
    expect(buildPath('en', '')).toBe('/en');
    expect(buildPath('en', 'about')).toBe('/en/about');
  });
});

describe('resolveEnabledLocales', () => {
  const both = ['pt-BR', 'en'];
  it('always includes the default locale, in a stable order', () => {
    expect(resolveEnabledLocales(['en'], both)).toEqual(['pt-BR', 'en']);
    expect(resolveEnabledLocales(['en', 'pt-BR'], both)).toEqual(['pt-BR', 'en']);
  });
  it('lets the env override win over settings', () => {
    expect(resolveEnabledLocales(['pt-BR'], both, 'pt-BR,en')).toEqual(['pt-BR', 'en']);
  });
  it('fails when an enabled locale has no content file', () => {
    expect(() => resolveEnabledLocales(['pt-BR', 'en'], ['pt-BR'])).toThrow(/site\.en\.json/);
  });
  it('rejects unknown locales', () => {
    expect(() => resolveEnabledLocales(['fr'], both)).toThrow(/fr/);
  });
  it('builds only Portuguese with the shipped settings', () => {
    expect(enabledLocales).toEqual(['pt-BR']);
  });
});

describe('content helpers', () => {
  it('maps pages to localized paths', () => {
    expect(localizedPath('pt-BR', 'home')).toBe('/');
    expect(localizedPath('pt-BR', 'about')).toBe('/sobre');
    expect(localizedPath('pt-BR', 'contact')).toBe('/contato');
    expect(localizedPath('pt-BR', 'privacy')).toBe('/privacidade');
    expect(localizedPath('en', 'about')).toBe('/en/about');
  });
  it('points booking links at the home page anchor', () => {
    expect(bookingHref('pt-BR')).toBe('/#agendar');
    expect(bookingHref('en')).toBe('/en#book');
  });
  it('interpolates tokens and leaves unknown ones alone', () => {
    expect(fmt('© {year} {name}', { year: 2026, name: 'Gabby' })).toBe('© 2026 Gabby');
    expect(fmt('{missing}', {})).toBe('{missing}');
  });
  it('formats dates with the page locale', () => {
    expect(formatDate('pt-BR', '2026-10-27')).toBe('27 de outubro de 2026');
    expect(formatDate('en', '2026-10-27')).toBe('October 27, 2026');
  });
  it('emits no hreflang while one locale is on', () => {
    expect(alternates('about', ['pt-BR'])).toEqual([]);
  });
  it('emits hreflang alternates plus x-default when English is on', () => {
    expect(alternates('about', ['pt-BR', 'en'])).toEqual([
      { hreflang: 'pt-BR', href: 'https://gabby-astrologia.pages.dev/sobre' },
      { hreflang: 'en', href: 'https://gabby-astrologia.pages.dev/en/about' },
      { hreflang: 'x-default', href: 'https://gabby-astrologia.pages.dev/sobre' },
    ]);
  });
  it('has the same disclaimer text the spec asks for', () => {
    expect(t('pt-BR').footer.disclaimer).toMatch(/não substituem orientação médica, psicológica, jurídica ou financeira/);
  });
});
