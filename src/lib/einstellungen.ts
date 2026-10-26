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
  kontingent: number; // Geschenke je Kunde und 12 Monate, 0 = unbegrenzt
  abTest: { aktiv: boolean; anteilB: number }; // Dankeschön-Test: Anteil der Kunden in Gruppe B (Prozent)
  spendeBetrag: number; // A: € je eingelöstem Geschenk für den gewählten Zweck
  praemieBetrag: number; // B: € Gutschein je stattgefundenem Gespräch
  praemieBildId: number | null;
  sozialAnzeigen: boolean;
  sozialStartwert: number; // echte Zahl aus dem alten System (Tellscale)
  erinnerungNachTagen: number;
  registerNr: string;
  impressumUrl: string; // externe Seiten (aveyo.de); leer = eigene Seite unter /info/…
  datenschutzUrl: string;
  erstinformationUrl: string;
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
  // Standard: Danke-Nachricht + Spende (von AVEYO gewünscht). Erlebnis/Doppeltes Geschenk aus. Nie Geld an den Empfehler
  // (Provisionsabgabeverbot, Tippgeber-Abgrenzung).
  belohnungen: { nachricht: true, spende: false, erlebnis: false, doppelt: false }, // Spende läuft jetzt automatisch über den A/B-Test
  kontingent: 3,
  abTest: { aktiv: true, anteilB: 50 },
  spendeBetrag: 10,
  praemieBetrag: 50,
  praemieBildId: null,
  sozialAnzeigen: true,
  sozialStartwert: 36,
  erinnerungNachTagen: 7,
  // Quelle: https://www.aveyo.de/erstinformationen (Stand Oktober 2026)
  registerNr: 'Adrian Nerhoff D-KHWD-FFLB9-02 (§ 34d GewO), D-F-131-NTTI-65 (§ 34f GewO) · Timo Konrad D-EAJS-AFQPN-81 (§ 34d GewO)',
  impressumUrl: 'https://www.aveyo.de/impressum',
  datenschutzUrl: 'https://www.aveyo.de/datenschutz',
  erstinformationUrl: 'https://www.aveyo.de/erstinformationen',
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
/** Texte für eine Seite. `ansprache`: Du/Sie für einen bestimmten Kunden, sonst die allgemeine Einstellung. */
export function texte(praefixe: string[] = [], ansprache?: Anrede | '' | null) {
  return textPaket(ansprache || einstellungen().anrede, textOverrides(), praefixe);
}

export function t(key: string, vars: Record<string, string | number | null | undefined> = {}, ansprache?: Anrede | '' | null) {
  return textRein(key, ansprache || einstellungen().anrede, textOverrides(), vars);
}

/** Du/Sie für einen Kunden: eigene Angabe, sonst allgemeine Einstellung. */
export const ansprache = (k: { ansprache?: string | null }): Anrede => (k.ansprache === 'du' || k.ansprache === 'sie' ? k.ansprache : einstellungen().anrede);

export const basisUrl = () => (process.env.GESCHENK_BASE_URL || 'http://localhost:3200').replace(/\/+$/, '');

export function beraterVon(id: number | null | undefined) {
  return id ? one('SELECT id, name, email, foto_id, vorstellung, video_url, termin_url FROM berater WHERE id = ?', id) : undefined;
}
