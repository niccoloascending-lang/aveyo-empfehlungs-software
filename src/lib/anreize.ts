// Anstöße zum Teilen – bewusst ohne Druck, Punkte oder Ranglisten. Rein → testbar.
// - Kontingent: „Du hast 3 Geschenke zu vergeben“ (rollierend 12 Monate, je Kunde erhöhbar)
// - Erinnerungsliste für Berater (die App erinnert nie selbst)
// - Bäume als sichtbare Wirkung, Zähler „Schon N Kunden …“ mit echtem Startwert

const ms = (s: string) => Date.parse(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');

export type Kontingent = { gesamt: number | null; verbraucht: number; rest: number | null };

/**
 * Geschenke, die ein Kunde in den letzten 12 Monaten verschenkt hat (jede geteilte Teilung zählt einmal,
 * erneutes Teilen desselben Links nicht). `basis` 0 = unbegrenzt.
 */
export function kontingent(basis: number, extra: number, geteiltAm: (string | null)[], jetzt = new Date()): Kontingent {
  const grenze = jetzt.getTime() - 365 * 86400_000;
  const verbraucht = geteiltAm.filter((g): g is string => !!g && ms(g) >= grenze).length;
  if (!basis || basis <= 0) return { gesamt: null, verbraucht, rest: null };
  const gesamt = basis + Math.max(0, extra || 0);
  return { gesamt, verbraucht, rest: Math.max(0, gesamt - verbraucht) };
}

export type ErinnerKunde = {
  id: number;
  token_erstellt: string | null;
  token_widerrufen: string | null;
  zuletzt_gesehen: string | null;
  geteilt: number;
  erinnert_am: string | null;
};
export type Erinnerung = { id: number; grund: 'nie_geoeffnet' | 'nicht_geteilt'; seitTagen: number };

/**
 * Wen könnte der Berater freundlich erinnern? Link aktiv, nichts geteilt, letzter Anstoß mindestens `tage` her,
 * und höchstens eine Erinnerung je 60 Tage.
 */
export function erinnerungen(kunden: ErinnerKunde[], jetzt = new Date(), tage = 7): Erinnerung[] {
  const t = jetzt.getTime();
  const tageSeit = (s: string) => Math.floor((t - ms(s)) / 86400_000);
  const out: Erinnerung[] = [];
  for (const k of kunden) {
    if (!k.token_erstellt || k.token_widerrufen || k.geteilt > 0) continue;
    if (k.erinnert_am && tageSeit(k.erinnert_am) < 60) continue;
    const bezug = k.zuletzt_gesehen ?? k.token_erstellt;
    const seit = tageSeit(bezug);
    if (seit < tage) continue;
    out.push({ id: k.id, grund: k.zuletzt_gesehen ? 'nicht_geteilt' : 'nie_geoeffnet', seitTagen: seit });
  }
  return out.sort((a, b) => (a.grund === b.grund ? b.seitTagen - a.seitTagen : a.grund === 'nicht_geteilt' ? -1 : 1));
}

/** „Schon N Kunden …“: echter Startwert (aus dem alten System) + Kunden, die hier geteilt haben. */
export const sozialeZahl = (startwert: number, kundenMitTeilung: number) => Math.max(0, Math.round(startwert || 0)) + Math.max(0, kundenMitTeilung);

/** Baumreihe für die Anzeige (max. `max` Symbole, Rest als Zahl). */
export function baumReihe(anzahl: number, max = 12): { symbole: number; mehr: number } {
  const n = Math.max(0, Math.floor(anzahl));
  return { symbole: Math.min(n, max), mehr: Math.max(0, n - max) };
}

/** Denkanstöße eines Geschenks („Wer fällt dir ein?“), eine Zeile je Anlass. */
export const anlaesseLesen = (s: string | null | undefined) =>
  (s ?? '')
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean)
    .slice(0, 6);
