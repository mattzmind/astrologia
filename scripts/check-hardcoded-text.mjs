// Fails if an .astro template contains visible text that doesn't come from the content files.
// Checks literal text between tags and literal alt / aria-label / title / placeholder attributes.
// Text inside {expressions} is skipped — those come from t(). Limitation: markup nested inside
// an expression (e.g. inside .map()) is skipped too.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'src');
const TEXT_ATTRS = ['alt', 'aria-label', 'title', 'placeholder', 'aria-description'];
// Allowed literal text: punctuation, symbols, numbers.
const ALLOWED = /^[\s\d.,:;·•|/+\-–—()×©✨🌙🌿*]*$/u;

function* astroFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* astroFiles(full);
    else if (entry.name.endsWith('.astro')) yield full;
  }
}

/** Replace {…} expressions (brace-balanced, string-aware) with spaces so line numbers survive. */
export function blankExpressions(src) {
  let out = '';
  let depth = 0;
  let quote = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (depth > 0) {
      if (quote) {
        if (ch === '\\') {
          out += '  ';
          i++;
          continue;
        }
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
      out += ch === '\n' ? '\n' : ' ';
      continue;
    }
    if (ch === '{') {
      depth = 1;
      out += ' ';
      continue;
    }
    out += ch;
  }
  return out;
}

const keepLines = (s) => s.replace(/[^\n]/g, ' ');

export function findHardcodedText(source) {
  let src = source;
  src = src.replace(/^---[\s\S]*?\n---/, keepLines); // frontmatter
  src = src.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, keepLines);
  src = src.replace(/<!--[\s\S]*?-->/g, keepLines);
  src = src.replace(/<svg\b[\s\S]*?<\/svg>/g, keepLines); // decorative art
  src = blankExpressions(src);

  const problems = [];
  const lineOf = (index) => src.slice(0, index).split('\n').length;

  for (const m of src.matchAll(/<[^>]+>/g)) {
    for (const attr of TEXT_ATTRS) {
      const am = m[0].match(new RegExp(`\\s${attr}=(["'])(.*?)\\1`));
      if (am && !ALLOWED.test(am[2])) problems.push({ line: lineOf(m.index), text: `${attr}="${am[2]}"` });
    }
  }
  const textOnly = src.replace(/<[^>]+>/g, keepLines);
  for (const m of textOnly.matchAll(/\S[^\n]*/g)) {
    const text = m[0].trim();
    if (text && !ALLOWED.test(text)) problems.push({ line: lineOf(m.index), text: `"${text}"` });
  }
  return problems;
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  let failed = 0;
  for (const file of astroFiles(root)) {
    const problems = findHardcodedText(fs.readFileSync(file, 'utf8'));
    if (!problems.length) continue;
    failed += problems.length;
    console.error(`\n${path.relative(process.cwd(), file)}`);
    for (const p of problems) console.error(`  line ${p.line}: ${p.text}`);
  }
  if (failed) {
    console.error(`\n✗ ${failed} hard-coded text(s). Move them into src/content/site.<locale>.json and read them with t().`);
    process.exit(1);
  }
  console.log('✓ No hard-coded text in templates.');
}
