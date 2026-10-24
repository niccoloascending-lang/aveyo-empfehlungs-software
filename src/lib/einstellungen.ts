// Einstellungen (Key/Value-JSON) mit Standardwerten und Textverwaltung aus der DB.
import { all, one, run } from './db.ts';
import { STANDARD_THEME, type Theme } from './theme.ts';
import { STANDARD_VERFUEGBARKEIT, type Verfuegbarkeit } from './slots.ts';
import { textPaket, text as textRein, type Anrede, type Overrides } from './texte.ts';

export type Belohnungen = { nachricht: boolean; spende: boolean; erlebnis: boolean; doppelt: boolean };

export type Einstellungen = {
  anrede: Anrede;
  theme: Theme;
  verfuegbarkeit: Verfuegbarkeit;
  terminModus: 'eigen' | 'extern';
  linkGueltigTage: number; // 0 = unbegrenzt
  loeschenMonate: number;
  doiTage: number;
  belohnungen: Belohnungen;
  registerNr: string;
  bewertungenUrl: string; // nur echte, verlinkbare Bewertungen
  adminMail: string; // Benachrichtigung bei neuen bestätigten Anfragen (ohne Namen)
  webhookUrl: string;
  webhookSecret: string;
  apiKeyHash: string;
};

export const STANDARD: Einstellungen = {
  anrede: 'du',
  theme: STANDARD_THEME,
  verfuegbarkeit: STANDARD_VERFUEGBARKEIT,
  terminModus: 'eigen',
  linkGueltigTage: 0,
  loeschenMonate: 6,
  doiTage: 7,
  // Standard: nur die persönliche Danke-Nachricht. Alles andere bewusst aus (Provisionsabgabeverbot, Tippgeber-Abgrenzung).
  belohnungen: { nachricht: true, spende: false, erlebnis: false, doppelt: false },
  registerNr: '',
  bewertungenUrl: '',
  adminMail: '',
  webhookUrl: '',
  webhookSecret: '',
  apiKeyHash: '',
};

export function einstellungen(): Einstellungen {
  const rows = all<{ schluessel: string; wert: string }>('SELECT schluessel, wert FROM einstellungen');
  const e: any = structuredClone(STANDARD);
  for (const r of rows) {
    if (!(r.schluessel in e)) continue;
    try {
      const v = JSON.parse(r.wert);
      e[r.schluessel] = v && typeof v === 'object' && !Array.isArray(v) ? { ...e[r.schluessel], ...v } : v;
    } catch {
      /* kaputter Wert → Standard */
    }
  }
  return e as Einstellungen;
}

export function setzeEinstellung<K extends keyof Einstellungen>(k: K, v: Einstellungen[K]) {
  run('INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?) ON CONFLICT(schluessel) DO UPDATE SET wert = excluded.wert', k, JSON.stringify(v));
}

export function textOverrides(): Overrides {
  const o: Overrides = {};
  for (const r of all<{ schluessel: string; du: string | null; sie: string | null }>('SELECT schluessel, du, sie FROM texte')) o[r.schluessel] = { du: r.du, sie: r.sie };
  return o;
}

/** Texte für eine Seite (nach Anrede, mit Admin-Überschreibungen). */
export function texte(praefixe: string[] = []) {
  const e = einstellungen();
  return textPaket(e.anrede, textOverrides(), praefixe);
}

export function t(key: string, vars: Record<string, string | number | null | undefined> = {}) {
  return textRein(key, einstellungen().anrede, textOverrides(), vars);
}

export const basisUrl = () => (process.env.GESCHENK_BASE_URL || 'http://localhost:3200').replace(/\/+$/, '');

export function beraterVon(id: number | null | undefined) {
  return id ? one('SELECT id, name, email, foto_id, vorstellung, video_url, termin_url FROM berater WHERE id = ?', id) : undefined;
}
