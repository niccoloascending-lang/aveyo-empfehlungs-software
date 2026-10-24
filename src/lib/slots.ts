// Eigener, einfacher Termin-Picker: freie Zeitfenster aus der Wochen-Verfügbarkeit. Alle Zeiten in Europe/Berlin,
// gespeichert als UTC-ISO. Rein → testbar.

export type Verfuegbarkeit = {
  wochentage: number[]; // 1 = Montag … 7 = Sonntag
  von: string; // "09:00"
  bis: string; // "18:00" (letzter Termin endet spätestens hier)
  dauerMin: number; // z. B. 30
  pufferMin: number; // Abstand zwischen Terminen
  vorlaufStunden: number; // frühester Termin ab jetzt
  tageVoraus: number; // wie weit im Voraus buchbar
  orte: ('online' | 'hamburg')[];
};

export const STANDARD_VERFUEGBARKEIT: Verfuegbarkeit = {
  wochentage: [1, 2, 3, 4, 5],
  von: '09:00',
  bis: '18:00',
  dauerMin: 30,
  pufferMin: 15,
  vorlaufStunden: 24,
  tageVoraus: 21,
  orte: ['online', 'hamburg'],
};

const TZ = 'Europe/Berlin';

/** Versatz von Europe/Berlin gegenüber UTC in Minuten zu einem Zeitpunkt (60 im Winter, 120 im Sommer). */
export function berlinOffsetMin(utcMs: number): number {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const lokal = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return Math.round((lokal - Math.floor(utcMs / 60000) * 60000) / 60000);
}

/** Berliner Ortszeit (Datum + "HH:MM") → UTC-Millisekunden. */
export function berlinZuUtc(jahr: number, monat: number, tag: number, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const naiv = Date.UTC(jahr, monat - 1, tag, h, m);
  let t = naiv - berlinOffsetMin(naiv) * 60000;
  t = naiv - berlinOffsetMin(t) * 60000; // zweite Runde für Zeiten nahe der Umstellung
  return t;
}

/** Berliner Kalenderdatum eines Zeitpunkts. */
export function berlinDatum(utcMs: number): { jahr: number; monat: number; tag: number; wochentag: number } {
  const d = new Date(utcMs + berlinOffsetMin(utcMs) * 60000);
  const wt = d.getUTCDay();
  return { jahr: d.getUTCFullYear(), monat: d.getUTCMonth() + 1, tag: d.getUTCDate(), wochentag: wt === 0 ? 7 : wt };
}

const minuten = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export type Zeitraum = { start: string; end: string };

/**
 * Freie Termine (UTC-ISO) ab `jetzt`, ohne bereits belegte (mit Puffer).
 * `blockiert`: belegte Zeiträume aus dem Google-Kalender des Beraters (frei/belegt, ohne Inhalte).
 */
export function freieSlots(v: Verfuegbarkeit, belegt: string[], jetzt: Date = new Date(), blockiert: Zeitraum[] = []): string[] {
  const out: string[] = [];
  const dauer = Math.max(10, v.dauerMin) * 60000;
  const puffer = Math.max(0, v.pufferMin) * 60000;
  const frueheste = jetzt.getTime() + v.vorlaufStunden * 3600_000;
  const belegtMs = belegt.map((b) => Date.parse(b)).filter((n) => !Number.isNaN(n));
  const bloecke = blockiert.map((b) => [Date.parse(b.start), Date.parse(b.end)]).filter(([s, e]) => !Number.isNaN(s) && !Number.isNaN(e));
  const schritt = Math.max(10, v.dauerMin + v.pufferMin);
  const start = berlinDatum(jetzt.getTime());
  for (let i = 0; i <= v.tageVoraus; i++) {
    // Kalendertag i Tage nach heute (Berlin), Mittag als sicherer Anker gegen Zeitumstellung
    const mittag = berlinZuUtc(start.jahr, start.monat, start.tag, '12:00') + i * 86400_000;
    const d = berlinDatum(mittag);
    if (!v.wochentage.includes(d.wochentag)) continue;
    for (let m = minuten(v.von); m + v.dauerMin <= minuten(v.bis); m += schritt) {
      const hhmm = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const t = berlinZuUtc(d.jahr, d.monat, d.tag, hhmm);
      if (t < frueheste) continue;
      if (belegtMs.some((b) => t < b + dauer + puffer && b < t + dauer + puffer)) continue;
      if (bloecke.some(([s, e]) => t < e + puffer && s < t + dauer + puffer)) continue;
      out.push(new Date(t).toISOString());
    }
  }
  return out;
}

/** "Di., 03.11.2026, 10:30 Uhr" */
export function terminText(iso: string): string {
  const d = new Date(iso);
  const datum = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const zeit = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
  return `${datum}, ${zeit} Uhr`;
}

/** Slots für die Anzeige nach Tag gruppieren. */
export function nachTag(slots: string[]): { tag: string; slots: { iso: string; zeit: string }[] }[] {
  const map = new Map<string, { iso: string; zeit: string }[]>();
  const fTag = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: '2-digit', month: '2-digit' });
  const fZeit = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  for (const s of slots) {
    const d = new Date(s);
    const k = fTag.format(d);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push({ iso: s, zeit: fZeit.format(d) });
  }
  return [...map.entries()].map(([tag, slots]) => ({ tag, slots }));
}

/** Ist ein gewünschter Slot (noch) gültig? Schutz gegen manipulierte Anfragen. */
export const slotGueltig = (v: Verfuegbarkeit, belegt: string[], iso: string, jetzt = new Date(), blockiert: Zeitraum[] = []) =>
  freieSlots(v, belegt, jetzt, blockiert).includes(iso);
