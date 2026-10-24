// .env.local für Skripte laden (Next.js macht das nur für die App).
import fs from 'node:fs';
import path from 'node:path';

export function ladeEnv() {
  for (const datei of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), datei);
    if (!fs.existsSync(p)) continue;
    for (const zeile of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(zeile);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 24) {
    console.error('SESSION_SECRET fehlt in .env.local (siehe .env.example).');
    process.exit(1);
  }
}
