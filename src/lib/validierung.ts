// Eingaben prüfen und säubern. Rein → testbar.

export const istEmail = (s: unknown): s is string =>
  typeof s === 'string' && s.length <= 200 && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/.test(s.trim());

export function sauber(s: unknown, max = 200): string {
  if (typeof s !== 'string') return '';
  return s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);
}

export function mehrzeilig(s: unknown, max = 5000): string {
  if (typeof s !== 'string') return '';
  return s.replace(/\r/g, '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').slice(0, max);
}

/**
 * Google-Kalender-ID aus der Eingabe. Erlaubt ist die ID selbst (meist die E-Mail) oder ein kopierter Link aus den
 * Google-Kalender-Einstellungen („Öffentliche URL“ …/embed?src=…, „iCal-Adresse“ …/ical/<id>/…). Unbrauchbar → null.
 */
export function kalenderId(x: unknown): string | null {
  const s = sauber(x, 1000);
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) return /\s/.test(s) ? null : s.slice(0, 200);
  try {
    const u = new URL(s);
    const src = u.searchParams.get('src');
    if (src) return sauber(src, 200) || null;
    const ical = /\/calendar\/ical\/([^/]+)\//.exec(u.pathname);
    if (ical) return sauber(decodeURIComponent(ical[1]), 200) || null;
  } catch {
    // kein gültiger Link
  }
  return null;
}

/** Telefon: nur Ziffern, +, Leerzeichen, /, -, (). Leer erlaubt. */
export function telefon(s: unknown): string | null {
  const t = sauber(s, 40);
  if (!t) return '';
  return /^\+?[\d\s/()-]{5,}$/.test(t) ? t : null;
}

export const THEMEN = [
  { v: 'pkv', t: 'PKV' },
  { v: 'vorsorge', t: 'Altersvorsorge' },
  { v: 'vermoegen', t: 'Vermögensaufbau' },
  { v: 'immobilien', t: 'Kapitalanlage-Immobilien' },
] as const;
export type Thema = (typeof THEMEN)[number]['v'];

/** Themenliste aus Text/Array lesen ("PKV, Vorsorge" → ['pkv','vorsorge']). Unbekanntes fällt weg. */
export function themenLesen(x: unknown): Thema[] {
  const roh = Array.isArray(x) ? x.join(',') : typeof x === 'string' ? x : '';
  const out = new Set<Thema>();
  for (const teil of roh.toLowerCase().split(/[,;|/]+/)) {
    const w = teil.trim();
    if (!w) continue;
    if (w.includes('pkv') || w.includes('kranken')) out.add('pkv');
    else if (w.includes('vorsorge') || w.includes('rente') || w.includes('alters')) out.add('vorsorge');
    else if (w.includes('verm') || w.includes('invest') || w.includes('fonds')) out.add('vermoegen');
    else if (w.includes('immo')) out.add('immobilien');
  }
  return THEMEN.map((t) => t.v).filter((v) => out.has(v));
}

/**
 * Geschenke für einen Kunden: passende zuerst, dann nach Reihenfolge, max. `max` Karten.
 * Ein Geschenk ohne Themen passt zu allen (z. B. Versicherungs-Check-up). Kunde ohne Themen: alle in Reihenfolge.
 */
export function geschenkeFuer<T extends { themen: string; reihenfolge: number }>(alle: T[], kundenThemen: string, max = 4): T[] {
  const k = new Set(themenLesen(kundenThemen));
  const treffer = (g: T) => {
    if (!k.size) return 1;
    const gt = themenLesen(g.themen);
    return !gt.length || gt.some((t) => k.has(t)) ? 1 : 0;
  };
  return [...alle].sort((a, b) => treffer(b) - treffer(a) || a.reihenfolge - b.reihenfolge).slice(0, max);
}

/** Link-Vorschau-Bots (WhatsApp, Telegram, Facebook, Slack …) zählen nicht als „geöffnet“. */
export function istVorschauBot(ua: string | null | undefined): boolean {
  if (!ua) return true;
  return /bot|crawl|spider|whatsapp|telegram|facebookexternalhit|slack|discord|skype|linkedin|preview|headless|curl|wget|python|go-http|signal/i.test(
    ua,
  );
}
