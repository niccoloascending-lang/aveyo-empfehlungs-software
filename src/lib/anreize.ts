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

export type Anlass = { id: number; text: string; icon: string; geschenke: string; themen: string; reihenfolge: number; aktiv: number };

const liste = (s: string) =>
  (s ?? '')
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Anlässe für einen Kunden: zuerst die zu seinen Themen passenden, dann die allgemeinen (ohne Themen), je nach Reihenfolge.
 * Anlässe mit Themen, die der Kunde nicht hat, entfallen. Nur Anlässe mit mindestens einem aktiven Geschenk.
 */
export function anlaesseFuer<A extends Anlass>(alle: A[], kundenThemen: string, aktiveGeschenkIds: number[], max = 6): (A & { geschenkIds: number[] })[] {
  const k = new Set(liste(kundenThemen));
  const aktiv = new Set(aktiveGeschenkIds);
  return alle
    .filter((a) => a.aktiv)
    .map((a) => ({ ...a, geschenkIds: liste(a.geschenke).map(Number).filter((id) => aktiv.has(id)) }))
    .filter((a) => a.geschenkIds.length > 0)
    .map((a) => {
      const th = liste(a.themen);
      const rang = !th.length ? 1 : th.some((t) => k.has(t)) ? 0 : -1;
      return { a, rang };
    })
    .filter((x) => x.rang >= 0)
    .sort((x, y) => x.rang - y.rang || x.a.reihenfolge - y.a.reihenfolge || x.a.id - y.a.id)
    .slice(0, max)
    .map((x) => x.a);
}

/** Denkanstöße eines Geschenks („Wer fällt dir ein?“), eine Zeile je Anlass. */
export const anlaesseLesen = (s: string | null | undefined) =>
  (s ?? '')
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean)
    .slice(0, 6);

// ---------- A/B-Test Dankeschön: A = Spende für einen guten Zweck, B = kleine Prämie für den Kunden ----------

export type Variante = 'A' | 'B';
export const istVariante = (x: unknown): x is Variante => x === 'A' || x === 'B';

/** Gruppe eines Kunden: bleibt fest, sobald vergeben. Ohne laufenden Test immer A. `zufall` ∈ [0,1). */
export function belohnungsVariante(vorhanden: unknown, testAktiv: boolean, anteilB: number, zufall: number): Variante {
  if (istVariante(vorhanden)) return vorhanden;
  if (!testAktiv) return 'A';
  return zufall * 100 < Math.min(100, Math.max(0, anteilB)) ? 'B' : 'A';
}

/** Prämie (B) wird fällig, wenn ein Gespräch stattgefunden hat: Status wechselt auf „Beratung“ oder „Kunde“. */
export const praemieFaellig = (alt: string, neu: string) => ['beratung', 'kunde'].includes(neu) && !['beratung', 'kunde'].includes(alt);

export type Zweck = { icon: string; name: string };

/** „🌳 Bäume pflanzen|🏠 SOS-Kinderdorf e.V.“ → [{icon, name}] (ohne Symbol: 💚). */
export function zweckeLesen(text: string): Zweck[] {
  return (text ?? '')
    .split('|')
    .map((z) => z.trim())
    .filter(Boolean)
    .map((z) => {
      const m = /^(\p{Extended_Pictographic}[\p{Extended_Pictographic}‍️]*)\s+(.+)$/u.exec(z);
      return m ? { icon: m[1], name: m[2].trim() } : { icon: '💚', name: z };
    });
}

/** Gewählter Zweck, falls (noch) gültig, sonst der erste. */
export const zweckOderStandard = (gewaehlt: string | null | undefined, zwecke: Zweck[]) =>
  zwecke.find((z) => z.name === gewaehlt)?.name ?? zwecke[0]?.name ?? '';

// ---------- Testimonials ----------

export type Testimonial = { id: number; themen: string; aktiv: number; reihenfolge: number };

/** Für ein Geschenk: zuerst Testimonials mit gemeinsamem Thema, dann allgemeine (ohne Themen); fremde Themen nur als Lückenfüller. */
export function testimonialsFuer<T extends Testimonial>(alle: T[], geschenkThemen: string, max = 2): T[] {
  const g = new Set(liste(geschenkThemen));
  const rang = (t: T) => {
    const th = liste(t.themen);
    if (th.some((x) => g.has(x))) return 0;
    return th.length ? 2 : 1;
  };
  return alle
    .filter((t) => t.aktiv)
    .sort((a, b) => rang(a) - rang(b) || a.reihenfolge - b.reihenfolge || a.id - b.id)
    .slice(0, max);
}
