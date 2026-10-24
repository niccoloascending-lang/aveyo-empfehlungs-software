// Löschkonzept. Rein → testbar.
// - Unbestätigte Anfragen (kein Double-Opt-in) nach `doiTage` Tagen
// - Anfragen ohne Termin (Download-Mail, Auswertung) nach `monate` Monaten
// - Anfragen mit Status „kein Interesse“ nach `monate` Monaten
// Termine/Beratungen/Kunden bleiben (Übergabe ins CRM, dort gelten eigene Fristen).

export type LoeschAnfrage = { id: number; typ: string; status: string; bestaetigt: string | null; erstellt: string; geaendert: string };

const ms = (s: string) => Date.parse(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');

export function zuLoeschen(anfragen: LoeschAnfrage[], jetzt: Date, monate: number, doiTage: number): number[] {
  const t = jetzt.getTime();
  const grenzeMonate = t - Math.max(1, monate) * 30.44 * 86400_000;
  const grenzeDoi = t - Math.max(1, doiTage) * 86400_000;
  return anfragen
    .filter((a) => {
      if (!a.bestaetigt) return ms(a.erstellt) < grenzeDoi;
      if (a.status === 'kein_interesse') return ms(a.geaendert) < grenzeMonate;
      if (a.typ !== 'termin' && a.status === 'neu') return ms(a.erstellt) < grenzeMonate;
      return false;
    })
    .map((a) => a.id);
}
