import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

// WCAG AA for the color pairs the site actually uses (SPEC section 5).
const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
const token = (name: string) => {
  const hex = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
  if (!hex) throw new Error(`missing token --color-${name}`);
  return hex;
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = 4.5;
const pairs: [fg: string, bg: string, min: number][] = [
  ['ink', 'bg', TEXT],
  ['ink', 'surface', TEXT],
  ['ink', 'lavender', TEXT], // hero text over the gradient
  ['ink', 'sunset', TEXT],
  ['earth', 'bg', TEXT], // secondary text
  ['earth', 'surface', TEXT],
  ['forest', 'bg', TEXT], // links
  ['forest', 'surface', TEXT], // secondary buttons
  ['on-forest', 'forest', TEXT], // primary buttons
  ['forest', 'bg', 3], // focus ring (non-text)
];

describe('color contrast', () => {
  it.each(pairs)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });
});
