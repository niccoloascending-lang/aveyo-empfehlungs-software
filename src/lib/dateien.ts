// Hochgeladene Dateien (Geschenkbilder, Download-Dateien, Beraterfotos, Logo) im Datenordner.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { DATA_DIR, insertRow, one } from './db.ts';

const ORDNER = path.join(DATA_DIR, 'dateien');
export const ERLAUBT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};
export const MAX_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
export const istVideo = (mime: string) => mime.startsWith('video/');

export async function speichereDatei(f: File): Promise<{ id: number } | { fehler: string }> {
  const endung = ERLAUBT[f.type];
  if (!endung) return { fehler: 'Erlaubt sind PNG, JPG, WebP, PDF und Videos (MP4, WebM, MOV).' };
  const max = istVideo(f.type) ? MAX_VIDEO_BYTES : MAX_BYTES;
  if (f.size > max) return { fehler: `Datei zu groß (max. ${Math.round(max / 1024 / 1024)} MB).` };
  fs.mkdirSync(ORDNER, { recursive: true });
  const name = crypto.randomBytes(12).toString('hex') + endung;
  // Als Strom schreiben – große Videos landen nicht komplett im Arbeitsspeicher
  await pipeline(Readable.fromWeb(f.stream() as any), fs.createWriteStream(path.join(ORDNER, name)));
  const id = insertRow('dateien', { name: (f.name || 'datei').slice(0, 120), mime: f.type, pfad: name, groesse: f.size });
  return { id };
}

/** Pfad und Metadaten (für Videos mit Range-Anfragen). */
export function dateiInfo(id: number): { name: string; mime: string; pfad: string; groesse: number } | null {
  const d = one<{ name: string; mime: string; pfad: string }>('SELECT name, mime, pfad FROM dateien WHERE id = ?', id);
  if (!d || d.pfad.includes('/') || d.pfad.includes('..')) return null;
  const p = path.join(ORDNER, d.pfad);
  if (!fs.existsSync(p)) return null;
  return { name: d.name, mime: d.mime, pfad: p, groesse: fs.statSync(p).size };
}

export function leseDatei(id: number): { name: string; mime: string; inhalt: Buffer } | null {
  const d = one<{ name: string; mime: string; pfad: string }>('SELECT name, mime, pfad FROM dateien WHERE id = ?', id);
  if (!d || d.pfad.includes('/') || d.pfad.includes('..')) return null;
  const p = path.join(ORDNER, d.pfad);
  if (!fs.existsSync(p)) return null;
  return { name: d.name, mime: d.mime, inhalt: fs.readFileSync(p) };
}
