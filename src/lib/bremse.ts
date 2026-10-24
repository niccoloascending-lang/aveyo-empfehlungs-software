// Ratenbegrenzung für öffentliche Formulare (pro Prozess, im Speicher, ohne IP-Speicherung in der DB).
const eimer = new Map<string, { n: number; start: number }>();

export function erlaubt(schluessel: string, max: number, fensterMs: number): boolean {
  const jetzt = Date.now();
  const e = eimer.get(schluessel);
  if (!e || jetzt - e.start > fensterMs) {
    eimer.set(schluessel, { n: 1, start: jetzt });
    if (eimer.size > 50_000) eimer.clear();
    return true;
  }
  e.n += 1;
  return e.n <= max;
}

/** Client-Kennung nur flüchtig für die Bremse (nie gespeichert). */
export function clientKey(req: Request): string {
  const h = req.headers;
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'lokal').trim();
}
