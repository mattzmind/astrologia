// Tiny static server that mimics Cloudflare static assets for tests: node scripts/serve-static.mjs <dir> <port>
// /sobre → sobre.html, /x/ → x/index.html, unknown paths → 404.html with status 404.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};

const isFile = (p) => p.startsWith(root) && fs.existsSync(p) && fs.statSync(p).isFile();

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const base = path.join(root, urlPath);
    const file = [base, `${base.replace(/[\\/]$/, '')}.html`, path.join(base, 'index.html')].find(isFile);
    const status = file ? 200 : 404;
    const served = file ?? path.join(root, '404.html');
    res.writeHead(status, {
      'Content-Type': TYPES[path.extname(served)] ?? 'application/octet-stream',
      'Cache-Control': served.includes(`${path.sep}_astro${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    fs.createReadStream(served).pipe(res);
  })
  .listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
