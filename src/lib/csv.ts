// CSV-Import von Kunden (auch Export aus dem bestehenden CRM). Trennzeichen ; oder , automatisch, Anführungszeichen,
// UTF-8 mit/ohne BOM. Rein → testbar.
import { istEmail, sauber, telefon, themenLesen } from './validierung.ts';

/** „Herr“/„Frau“ aus der CSV, alles andere = keine Angabe. */
export function anredeLesen(s: string): '' | 'herr' | 'frau' {
  const w = s.trim().toLowerCase();
  return w === 'herr' || w === 'hr.' || w === 'hr' ? 'herr' : w === 'frau' || w === 'fr.' || w === 'fr' ? 'frau' : '';
}
export function anspracheLesen(s: string): '' | 'du' | 'sie' {
  const w = s.trim().toLowerCase();
  return w === 'du' ? 'du' : w === 'sie' ? 'sie' : '';
}

export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '');
  const ersteZeile = t.split(/\r?\n/, 1)[0] ?? '';
  const trenner = (ersteZeile.match(/;/g)?.length ?? 0) >= (ersteZeile.match(/,/g)?.length ?? 0) ? ';' : ',';
  const zeilen: string[][] = [];
  let feld = '';
  let zeile: string[] = [];
  let inQuote = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuote) {
      if (c === '"' && t[i + 1] === '"') {
        feld += '"';
        i++;
      } else if (c === '"') inQuote = false;
      else feld += c;
    } else if (c === '"') inQuote = true;
    else if (c === trenner) {
      zeile.push(feld);
      feld = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      zeile.push(feld);
      if (zeile.some((f) => f.trim() !== '')) zeilen.push(zeile);
      zeile = [];
      feld = '';
    } else feld += c;
  }
  zeile.push(feld);
  if (zeile.some((f) => f.trim() !== '')) zeilen.push(zeile);
  return zeilen;
}

const SPALTEN: Record<string, string[]> = {
  vorname: ['vorname', 'first name', 'firstname', 'first_name'],
  nachname: ['nachname', 'name', 'last name', 'lastname', 'last_name', 'familienname'],
  email: ['email', 'e-mail', 'mail', 'e_mail'],
  handy: ['handy', 'mobil', 'telefon', 'phone', 'mobile', 'tel'],
  themen: ['themen', 'thema', 'interessen', 'sparten'],
  extern_id: ['id', 'crm_id', 'kunden_id', 'kundennummer', 'extern_id'],
  anrede: ['anrede', 'salutation'],
  ansprache: ['ansprache', 'du/sie', 'duzen'],
};

export type CsvKunde = { vorname: string; nachname: string; anrede: '' | 'herr' | 'frau'; ansprache: '' | 'du' | 'sie'; email: string; handy: string; themen: string; extern_id: string };
export type CsvErgebnis = { kunden: CsvKunde[]; fehler: { zeile: number; grund: string }[]; spalten: Record<string, number> };

export function kundenAusCsv(text: string): CsvErgebnis {
  const zeilen = parseCsv(text);
  const fehler: CsvErgebnis['fehler'] = [];
  if (!zeilen.length) return { kunden: [], fehler: [{ zeile: 1, grund: 'Datei ist leer.' }], spalten: {} };
  const kopf = zeilen[0].map((h) => h.trim().toLowerCase());
  const spalten: Record<string, number> = {};
  for (const [feld, namen] of Object.entries(SPALTEN)) {
    const i = kopf.findIndex((h) => namen.includes(h));
    if (i >= 0) spalten[feld] = i;
  }
  if (spalten.vorname == null || spalten.email == null)
    return { kunden: [], fehler: [{ zeile: 1, grund: 'Spalten „Vorname“ und „E-Mail“ werden mindestens benötigt.' }], spalten };
  const kunden: CsvKunde[] = [];
  const gesehen = new Set<string>();
  zeilen.slice(1).forEach((z, idx) => {
    const nr = idx + 2;
    const get = (f: string) => (spalten[f] != null ? z[spalten[f]] ?? '' : '');
    const vorname = sauber(get('vorname'), 80);
    const email = sauber(get('email'), 200).toLowerCase();
    const handy = telefon(get('handy'));
    if (!vorname) return fehler.push({ zeile: nr, grund: 'Vorname fehlt' });
    if (!istEmail(email)) return fehler.push({ zeile: nr, grund: 'E-Mail ungültig' });
    if (handy === null) return fehler.push({ zeile: nr, grund: 'Handynummer ungültig' });
    if (gesehen.has(email)) return fehler.push({ zeile: nr, grund: 'E-Mail doppelt in der Datei' });
    gesehen.add(email);
    kunden.push({
      vorname,
      nachname: sauber(get('nachname'), 80),
      anrede: anredeLesen(get('anrede')),
      ansprache: anspracheLesen(get('ansprache')),
      email,
      handy,
      themen: themenLesen(get('themen')).join(','),
      extern_id: sauber(get('extern_id'), 80),
    });
  });
  return { kunden, fehler, spalten };
}
