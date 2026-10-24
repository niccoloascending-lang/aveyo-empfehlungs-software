// Validierung der Geschenk-Daten aus dem Admin.
import { mehrzeilig, sauber, themenLesen } from './validierung.ts';

export function geschenkDaten(d: any): Record<string, any> | { fehler: string } {
  const titel = sauber(d.titel, 120);
  if (!titel) return { fehler: 'Titel fehlt.' };
  const typ = ['termin', 'download', 'rechner'].includes(d.typ) ? d.typ : null;
  if (!typ) return { fehler: 'Typ wählen: Termin, Download oder Rechner.' };
  const id = (x: unknown) => (Number.isInteger(Number(x)) && Number(x) > 0 ? Number(x) : null);
  const inhalt = mehrzeilig(d.inhalt, 50000);
  if (typ === 'download' && !id(d.datei_id) && !inhalt.trim()) return { fehler: 'Für einen Download bitte eine Datei hochladen oder einen Inhalt eintragen.' };
  return {
    titel,
    kurz: sauber(d.kurz, 240),
    nutzen: mehrzeilig(d.nutzen, 1000),
    ablauf: mehrzeilig(d.ablauf, 1000),
    dauer: sauber(d.dauer, 60),
    typ,
    themen: themenLesen(d.themen).join(','),
    icon: sauber(d.icon, 8) || '🎁',
    bild_id: id(d.bild_id),
    datei_id: typ === 'download' ? id(d.datei_id) : null,
    inhalt: typ === 'download' ? inhalt || null : null,
    rechner: typ === 'rechner' ? 'rentenluecke' : null,
    aktiv: d.aktiv ? 1 : 0,
    reihenfolge: Number.isFinite(Number(d.reihenfolge)) ? Math.round(Number(d.reihenfolge)) : 0,
  };
}
