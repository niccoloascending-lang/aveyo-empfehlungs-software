// Validierung der Anlässe aus dem Admin.
import { sauber, themenLesen } from './validierung.ts';

export function anlassDaten(d: any): Record<string, any> | { fehler: string } {
  const text = sauber(d.text, 120);
  if (!text) return { fehler: 'Bitte den Anlass eintragen, z. B. „gerade umgezogen ist“.' };
  const ids = (Array.isArray(d.geschenke) ? d.geschenke : String(d.geschenke ?? '').split(','))
    .map((x: unknown) => Number(x))
    .filter((n: number, i: number, a: number[]) => Number.isInteger(n) && n > 0 && a.indexOf(n) === i)
    .slice(0, 3);
  if (!ids.length) return { fehler: 'Mindestens ein passendes Geschenk wählen.' };
  return {
    text,
    icon: sauber(d.icon, 8) || '✨',
    geschenke: ids.join(','),
    themen: themenLesen(d.themen).join(','),
    reihenfolge: Number.isFinite(Number(d.reihenfolge)) ? Math.round(Number(d.reihenfolge)) : 0,
    aktiv: d.aktiv ? 1 : 0,
  };
}
