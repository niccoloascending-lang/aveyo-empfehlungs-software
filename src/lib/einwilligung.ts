// Einwilligungen und „Meine Wirkung“. Grundsatz: Der Empfehler sieht nur Zahlen. Einen Namen sieht er nur,
// wenn der Freund aktiv (nicht vorausgewählt) zugestimmt und nicht widerrufen hat. Rein → testbar.

export const EINWILLIGUNGEN = ['datenschutz', 'empfehler_info', 'email_kontakt'] as const;
export type EinwilligungsArt = (typeof EINWILLIGUNGEN)[number];

export type Einwilligung = { anfrage_id: number; art: EinwilligungsArt; erteilt: string; widerrufen?: string | null; bestaetigt?: string | null };

/** Checkbox-Wert streng auswerten: nur echtes `true` zählt (kein "on", kein 1, nichts vorausgewählt). */
export const aktivAngehakt = (v: unknown): boolean => v === true;

export function hatEinwilligung(liste: Einwilligung[], anfrageId: number, art: EinwilligungsArt): boolean {
  return liste.some((e) => e.anfrage_id === anfrageId && e.art === art && !e.widerrufen);
}

/** Double-Opt-in: Wie lange gilt ein Bestätigungslink? */
export const DOI_STUNDEN = 72;
export function doiAbgelaufen(erstellt: string, jetzt = new Date(), stunden = DOI_STUNDEN): boolean {
  const t = Date.parse(erstellt.includes('T') ? erstellt : erstellt.replace(' ', 'T') + 'Z');
  return Number.isNaN(t) || jetzt.getTime() > t + stunden * 3600_000;
}

export type WirkungTeilung = { id: number; geschenk: string; geteilt_am: string | null };
export type WirkungEreignis = { teilung_id: number; typ: string; zeit: string };
export type WirkungAnfrage = { id: number; teilung_id: number; vorname: string | null; geschenk: string; erstellt: string; bestaetigt: string | null };

export type Wirkung = {
  verschenkt: number;
  geoeffnet: number;
  eingeloest: number;
  personen: { name: string; geschenk: string }[];
  neuSeit: number; // Einlösungen seit dem letzten Besuch → Freudenmoment
};

const EINLOESUNG = new Set(['download', 'rechner', 'termin_bestaetigt', 'auswertung_bestaetigt', 'download_mail_bestaetigt']);

export function berechneWirkung(
  teilungen: WirkungTeilung[],
  ereignisse: WirkungEreignis[],
  anfragen: WirkungAnfrage[],
  einwilligungen: Einwilligung[],
  zuletztGesehen: string | null,
): Wirkung {
  const ids = new Set(teilungen.map((t) => t.id));
  const eig = ereignisse.filter((e) => ids.has(e.teilung_id));
  const seit = zuletztGesehen ? Date.parse(zuletztGesehen.replace(' ', 'T') + (zuletztGesehen.includes('Z') ? '' : 'Z')) : 0;
  const zeit = (s: string) => Date.parse(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  const einl = eig.filter((e) => EINLOESUNG.has(e.typ));
  const personen = anfragen
    .filter((a) => ids.has(a.teilung_id) && a.bestaetigt && a.vorname && hatEinwilligung(einwilligungen, a.id, 'empfehler_info'))
    .map((a) => ({ name: a.vorname!.trim().split(/\s+/)[0], geschenk: a.geschenk }));
  return {
    verschenkt: teilungen.filter((t) => t.geteilt_am).length,
    geoeffnet: eig.filter((e) => e.typ === 'geoeffnet').length,
    eingeloest: einl.length,
    personen,
    neuSeit: einl.filter((e) => zeit(e.zeit) > seit).length,
  };
}
