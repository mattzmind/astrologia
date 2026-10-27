// Post-build checks on the generated site: node scripts/check-dist.mjs <dir> [--strict]
// - every internal link and #anchor resolves to a built file / element id
// - every page has <html lang>, <title>, a description and an absolute og:image
// - production builds contain no [[PREENCHER]] markers (--strict forces this check)
// - launch builds (LAUNCH=1) require calLink and contactEmail
import fs from 'node:fs';
import path from 'node:path';
import { isLaunchBuild, isPreviewMode } from '../src/lib/mode.ts';
import { PLACEHOLDER_MARKER, isFilled } from '../src/lib/placeholder.ts';

const dist = path.resolve(process.argv[2] ?? 'dist');
const strict = process.argv.includes('--strict') || !isPreviewMode(process.env, false);
const errors = [];

const htmlFiles = fs
  .readdirSync(dist, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.split(path.sep).join('/'));
const pages = new Map(htmlFiles.map((f) => [f, fs.readFileSync(path.join(dist, f), 'utf8')]));

/** URL path → built file, following Cloudflare Pages' rules for build.format 'file'. */
function resolveFile(urlPath) {
  const clean = decodeURI(urlPath).replace(/^\//, '');
  const candidates = clean === '' ? ['index.html'] : [clean, `${clean}.html`, `${clean}/index.html`];
  return candidates.find((c) => fs.existsSync(path.join(dist, c)) && fs.statSync(path.join(dist, c)).isFile());
}
const idsIn = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

for (const [file, html] of pages) {
  const where = `${file}:`;
  if (!/<html lang="[^"]+"/.test(html)) errors.push(`${where} <html> sem lang`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${where} sem <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${where} sem meta description`);
  if (!/<meta property="og:image" content="https?:\/\//.test(html)) errors.push(`${where} og:image ausente ou relativo`);
  if (strict && html.includes(PLACEHOLDER_MARKER)) {
    errors.push(`${where} contém ${PLACEHOLDER_MARKER}]] num build de produção`);
  }

  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(ref) || ref.startsWith('//')) continue;
    const [urlPath, hash] = ref.split('#');
    const target = urlPath === '' ? file : resolveFile(urlPath);
    if (!target) {
      errors.push(`${where} link quebrado → ${ref}`);
      continue;
    }
    if (hash && target.endsWith('.html') && !idsIn(pages.get(target) ?? '').has(hash)) {
      errors.push(`${where} âncora inexistente → ${ref}`);
    }
  }
}

if (isLaunchBuild()) {
  const settingsFile = process.env.SETTINGS_OVERRIDE ?? 'src/content/settings.json';
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  if (!isFilled(settings.calLink?.['pt-BR'])) errors.push('settings: calLink.pt-BR precisa estar preenchido para publicar');
  if (!isFilled(settings.contactEmail)) errors.push('settings: contactEmail precisa estar preenchido (privacidade/LGPD)');
}

if (errors.length) {
  console.error(`✗ check-dist (${path.relative(process.cwd(), dist)}): ${errors.length} problema(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`✓ check-dist: ${pages.size} páginas OK${strict ? ' (sem marcadores)' : ''}.`);
