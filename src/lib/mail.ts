// E-Mail-Versand. Nur für: Double-Opt-in-Bestätigungen, Terminbestätigung/Download nach Bestätigung, Admin-Hinweise.
// NIE an Freunde ohne deren eigene Eingabe + Bestätigung. Ohne SMTP_HOST: Entwicklungs-Postausgang (data/postausgang).
// Es wird nichts über Inhalte geloggt.
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './db.ts';

export type Mail = { an: string; betreff: string; text: string; antwortAn?: string };

export const POSTAUSGANG = path.join(DATA_DIR, 'postausgang');

export async function sendeMail(m: Mail): Promise<boolean> {
  if (!process.env.SMTP_HOST) {
    fs.mkdirSync(POSTAUSGANG, { recursive: true });
    const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 7)}.json`;
    fs.writeFileSync(path.join(POSTAUSGANG, name), JSON.stringify(m, null, 2));
    return true;
  }
  try {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: process.env.MAIL_FROM || 'AVEYO <no-reply@localhost>', to: m.an, subject: m.betreff, text: m.text, replyTo: m.antwortAn });
    return true;
  } catch (e) {
    console.error('Mailversand fehlgeschlagen:', (e as Error).message);
    return false;
  }
}

export function postausgang(max = 50): (Mail & { datei: string })[] {
  if (!fs.existsSync(POSTAUSGANG)) return [];
  return fs
    .readdirSync(POSTAUSGANG)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, max)
    .map((f) => ({ ...JSON.parse(fs.readFileSync(path.join(POSTAUSGANG, f), 'utf8')), datei: f }));
}
