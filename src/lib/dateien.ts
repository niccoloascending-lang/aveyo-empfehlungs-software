// Hochgeladene Dateien (Geschenkbilder, Download-Dateien, Beraterfotos, Logo) im Datenordner.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR, insertRow, one } from './db.ts';

const ORDNER = path.join(DATA_DIR, 'dateien');
export const ERLAUBT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
export const MAX_BYTES = 15 * 1024 * 1024;

export async function speichereDatei(f: File): Promise<{ id: number } | { fehler: string }> {
  const endung = ERLAUBT[f.type];
  if (!endung) return { fehler: 'Erlaubt sind PNG, JPG, WebP und PDF.' };
  if (f.size > MAX_BYTES) return { fehler: 'Datei zu groß (max. 15 MB).' };
  fs.mkdirSync(ORDNER, { recursive: true });
  const name = crypto.randomBytes(12).toString('hex') + endung;
  fs.writeFileSync(path.join(ORDNER, name), Buffer.from(await f.arrayBuffer()));
  const id = insertRow('dateien', { name: (f.name || 'datei').slice(0, 120), mime: f.type, pfad: name, groesse: f.size });
  return { id };
}

export function leseDatei(id: number): { name: string; mime: string; inhalt: Buffer } | null {
  const d = one<{ name: string; mime: string; pfad: string }>('SELECT name, mime, pfad FROM dateien WHERE id = ?', id);
  if (!d || d.pfad.includes('/') || d.pfad.includes('..')) return null;
  const p = path.join(ORDNER, d.pfad);
  if (!fs.existsSync(p)) return null;
  return { name: d.name, mime: d.mime, inhalt: fs.readFileSync(p) };
}
