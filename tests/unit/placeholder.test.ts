import { describe, expect, it } from 'vitest';
import { isLaunchBuild, isPreviewMode } from '../../src/lib/mode';
import { collectPlaceholders, hasPlaceholder, isFilled, shown, shows } from '../../src/lib/placeholder';

const P = '[[PREENCHER: algo]]';

describe('placeholder detection', () => {
  it('finds markers anywhere in nested data', () => {
    expect(hasPlaceholder(P)).toBe(true);
    expect(hasPlaceholder({ a: [{ b: `texto ${P}` }] })).toBe(true);
    expect(hasPlaceholder({ a: ['ok'], n: 1 })).toBe(false);
  });
  it('treats empty and placeholder strings as unfilled', () => {
    expect(isFilled('Gabby')).toBe(true);
    expect(isFilled('')).toBe(false);
    expect(isFilled('   ')).toBe(false);
    expect(isFilled(P)).toBe(false);
    expect(isFilled(undefined)).toBe(false);
  });
  it('hides unfilled items in production and shows them in preview', () => {
    const items = [{ quote: 'real' }, { quote: P }];
    expect(shown(items, false)).toEqual([{ quote: 'real' }]);
    expect(shown(items, true)).toEqual(items);
    expect(shows(P, false)).toBe(false);
    expect(shows(P, true)).toBe(true);
    expect(shows('', true)).toBe(false);
  });
  it('reports dot paths of open fields', () => {
    expect(collectPlaceholders({ home: { faq: [{ a: 'ok' }, { a: P }] }, x: P })).toEqual(['home.faq.1.a', 'x']);
  });
});

describe('build modes', () => {
  it('previews in dev, on request, and on Cloudflare preview branches', () => {
    expect(isPreviewMode({}, true)).toBe(true);
    expect(isPreviewMode({ SHOW_PLACEHOLDERS: '1' }, false)).toBe(true);
    expect(isPreviewMode({ CF_PAGES_BRANCH: 'feature/sobre' }, false)).toBe(true);
    expect(isPreviewMode({ CF_PAGES_BRANCH: 'main' }, false)).toBe(false);
    expect(isPreviewMode({}, false)).toBe(false);
  });
  it('treats main on Cloudflare (or LAUNCH=1) as a launch build', () => {
    expect(isLaunchBuild({ CF_PAGES_BRANCH: 'main' })).toBe(true);
    expect(isLaunchBuild({ LAUNCH: '1' })).toBe(true);
    expect(isLaunchBuild({ CF_PAGES_BRANCH: 'dev' })).toBe(false);
  });
});
