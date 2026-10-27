import { describe, expect, it } from 'vitest';
import { findHardcodedText } from '../../scripts/check-hardcoded-text.mjs';

const texts = (src: string) => findHardcodedText(src).map((p: { text: string }) => p.text);

describe('hard-coded text guard', () => {
  it('flags literal text and literal accessible names', () => {
    expect(texts('<p>Olá mundo</p>')).toEqual(['"Olá mundo"']);
    expect(texts('<img alt="Foto da Gabby" src={x} />')).toEqual(['alt="Foto da Gabby"']);
    expect(texts('<nav aria-label="Menu"></nav>')).toEqual(['aria-label="Menu"']);
  });
  it('accepts text from expressions, frontmatter, scripts, styles and svg', () => {
    const src = `---
const label = 'Sobre';
---
<a href="/sobre" aria-label={c.a11y.x}>{label}</a>
<p>{items.map((i) => <span>{i}</span>)}</p>
<script>console.log("hi")</script>
<style>.a::after { content: 'x'; }</style>
<svg><title>art</title></svg>
<p>{'}'} · {x}</p>`;
    expect(texts(src)).toEqual([]);
  });
});
