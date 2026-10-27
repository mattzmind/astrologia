// Lists every [[PREENCHER]] still open in the content and settings files: npm run placeholders
import fs from 'node:fs';
import path from 'node:path';
import { collectPlaceholders } from '../src/lib/placeholder.ts';

const dir = path.resolve(import.meta.dirname, '..', 'src', 'content');
let total = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const open = collectPlaceholders(data);
  total += open.length;
  if (!open.length) continue;
  console.log(`\nsrc/content/${file}`);
  for (const key of open) {
    const value = key.split('.').reduce((v, k) => v[k], data);
    console.log(`  ${key}\n    ${value}`);
  }
}
console.log(total ? `\n${total} campos para preencher.` : '✓ Nenhum campo para preencher.');
