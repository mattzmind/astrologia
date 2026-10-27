import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { settingsSchema, siteContentSchema } from '../../src/i18n/schema';
import { instagramDmUrl, whatsappUrl } from '../../src/lib/links';

const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
const content = read('src/content/site.pt-BR.json');
const settings = read('src/content/settings.json');

describe('content and settings schemas', () => {
  it('accepts the shipped files and the test fixtures', () => {
    expect(siteContentSchema.safeParse(content).success).toBe(true);
    expect(siteContentSchema.safeParse(read('tests/fixtures/content/site.en.json')).success).toBe(true);
    expect(settingsSchema.safeParse(settings).success).toBe(true);
    expect(settingsSchema.safeParse(read('tests/fixtures/settings.json')).success).toBe(true);
  });
  it('rejects misspelled keys in content', () => {
    const typo = { ...content, nav: { ...content.nav, abuot: 'Sobre' } };
    expect(siteContentSchema.safeParse(typo).success).toBe(false);
  });
  it('rejects missing keys in content', () => {
    const { footer: _footer, ...missing } = content;
    expect(siteContentSchema.safeParse(missing).success).toBe(false);
  });
  it('validates real settings values', () => {
    const bad = (patch: object) => settingsSchema.safeParse({ ...settings, ...patch }).success;
    expect(bad({ whatsappNumber: '+55 21 99999-9999' })).toBe(false);
    expect(bad({ instagramHandle: '@gabby' })).toBe(false);
    expect(bad({ calLink: { 'pt-BR': 'https://cal.com/gabby/leitura' } })).toBe(false);
    expect(bad({ contactEmail: 'nao-e-email' })).toBe(false);
    expect(bad({ whatsappNumber: '5521999999999', calLink: { 'pt-BR': 'gabby/leitura' } })).toBe(true);
  });
});

describe('contact links', () => {
  it('URL-encodes the WhatsApp greeting', () => {
    const url = whatsappUrl('5521999999999', 'Oi, Gabby! ✨ & tal');
    expect(url.startsWith('https://wa.me/5521999999999?text=')).toBe(true);
    expect(new URL(url).searchParams.get('text')).toBe('Oi, Gabby! ✨ & tal');
  });
  it('builds the Instagram DM link', () => {
    expect(instagramDmUrl('gabby.astro')).toBe('https://ig.me/m/gabby.astro');
  });
});
