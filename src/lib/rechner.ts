// Rentenlücken-Rechner (Geschenktyp „Rechner“). Bewusst einfache, transparente Modellrechnung zur Orientierung.
// Keine Renditeannahmen, keine Produktempfehlung. Alle Annahmen werden mit dem Ergebnis angezeigt. Rein → testbar.

export type RechnerEingabe = {
  alter: number; // heutiges Alter
  rentenalter: number; // geplanter Rentenbeginn
  netto: number; // heutiges Nettoeinkommen pro Monat
  rente: number; // erwartete gesetzliche/sonstige Rente pro Monat (netto, heutige Kaufkraft, z. B. aus der Renteninformation)
  zielProzent: number; // gewünschter Anteil des heutigen Nettos im Alter (z. B. 80)
  inflation: number; // angenommene Inflation p. a. in Prozent (z. B. 2)
};

export const RECHNER_STANDARD: RechnerEingabe = { alter: 35, rentenalter: 67, netto: 3500, rente: 1400, zielProzent: 80, inflation: 2 };

export type RechnerErgebnis = {
  jahreBisRente: number;
  bedarfHeute: number;
  lueckeHeute: number; // in heutiger Kaufkraft
  lueckeBeiRentenbeginn: number; // nominal, mit Inflation hochgerechnet
  annahmen: string[];
};

const zahl = (x: unknown, min: number, max: number): number | null => {
  const n = typeof x === 'string' ? Number(x.replace(',', '.')) : typeof x === 'number' ? x : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

/** Eingaben prüfen. Gibt Fehlertext oder bereinigte Eingabe zurück. */
export function pruefeEingabe(x: Record<string, unknown>): { fehler: string } | { eingabe: RechnerEingabe } {
  const alter = zahl(x.alter, 16, 80);
  const rentenalter = zahl(x.rentenalter, 50, 75);
  const netto = zahl(x.netto, 0, 100000);
  const rente = zahl(x.rente, 0, 100000);
  const zielProzent = zahl(x.zielProzent, 30, 120);
  const inflation = zahl(x.inflation, 0, 10);
  if (alter == null || rentenalter == null || netto == null || rente == null || zielProzent == null || inflation == null)
    return { fehler: 'Bitte alle Felder mit realistischen Werten füllen.' };
  if (rentenalter <= alter) return { fehler: 'Der Rentenbeginn muss nach dem heutigen Alter liegen.' };
  return { eingabe: { alter, rentenalter, netto, rente, zielProzent, inflation } };
}

export function rentenluecke(e: RechnerEingabe): RechnerErgebnis {
  const jahre = Math.round(e.rentenalter - e.alter);
  const bedarf = (e.netto * e.zielProzent) / 100;
  const luecke = Math.max(0, bedarf - e.rente);
  const faktor = Math.pow(1 + e.inflation / 100, jahre);
  return {
    jahreBisRente: jahre,
    bedarfHeute: Math.round(bedarf),
    lueckeHeute: Math.round(luecke),
    lueckeBeiRentenbeginn: Math.round(luecke * faktor),
    annahmen: [
      `Bedarf im Alter: ${e.zielProzent} % des heutigen Nettoeinkommens`,
      `Erwartete Rente: ${Math.round(e.rente)} € pro Monat in heutiger Kaufkraft (eigene Angabe)`,
      `Inflation: ${e.inflation} % pro Jahr über ${jahre} Jahre`,
      'Steuern, Sozialabgaben im Alter und Kapitalerträge sind nicht berücksichtigt.',
    ],
  };
}

export const euro = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
