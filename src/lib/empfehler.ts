// Daten für „Mein Geschenke-Bereich“ des Empfehlers.
import { all, run } from './db.ts';
import { einstellungen, texte } from './einstellungen.ts';
import { aktiveGeschenke, beraterFuerKunde, teilungenVonKunde } from './teilungen.ts';
import { berechneWirkung, type Einwilligung } from './einwilligung.ts';
import { geschenkeFuer } from './validierung.ts';
import { imSatz } from './teilen.ts';
import type { Kunde } from './kunden.ts';

export function wirkungVon(kunde: Kunde, zuletztGesehen: string | null) {
  const teilungen = teilungenVonKunde(kunde.id);
  const ids = teilungen.map((t) => t.id);
  if (!ids.length) return berechneWirkung([], [], [], [], zuletztGesehen);
  const platz = ids.map(() => '?').join(',');
  const ereignisse = all<{ teilung_id: number; typ: string; zeit: string }>(`SELECT teilung_id, typ, zeit FROM ereignisse WHERE teilung_id IN (${platz})`, ...ids);
  const anfragen = all<{ id: number; teilung_id: number; vorname: string | null; geschenk: string; erstellt: string; bestaetigt: string | null }>(
    `SELECT a.id, a.teilung_id, a.vorname, g.titel geschenk, a.erstellt, a.bestaetigt FROM anfragen a JOIN geschenke g ON g.id = a.geschenk_id WHERE a.teilung_id IN (${platz})`,
    ...ids,
  );
  const einw = all<Einwilligung>(
    `SELECT e.anfrage_id, e.art, e.erteilt, e.widerrufen, e.bestaetigt FROM einwilligungen e JOIN anfragen a ON a.id = e.anfrage_id WHERE a.teilung_id IN (${platz})`,
    ...ids,
  );
  return berechneWirkung(teilungen, ereignisse, anfragen, einw, zuletztGesehen);
}

export function empfehlerDaten(kunde: Kunde) {
  const e = einstellungen();
  const wirkung = wirkungVon(kunde, kunde.zuletzt_gesehen);
  run("UPDATE kunden SET zuletzt_gesehen = datetime('now') WHERE id = ?", kunde.id);
  const b = beraterFuerKunde(kunde.id);
  const dankeschoens = all<{ id: number; art: string; spende_zweck: string | null; status: string }>(
    'SELECT id, art, spende_zweck, status FROM dankeschoens WHERE kunde_id = ? ORDER BY id DESC',
    kunde.id,
  ).filter((d) => d.art !== 'nachricht' && e.belohnungen[d.art as keyof typeof e.belohnungen]);
  const t = texte(['kunde.', 'freund.einwilligung', 'belohnung.']);
  return {
    vorname: kunde.vorname,
    berater: b ? { name: b.name, foto_id: b.foto_id, video_url: b.video_url } : null,
    geschenke: geschenkeFuer(aktiveGeschenke(), kunde.themen, 4).map((g) => ({ id: g.id, titel: g.titel, satz: imSatz(g), kurz: g.kurz, icon: g.icon, typ: g.typ, bild_id: g.bild_id })),
    t,
    wirkung,
    // Danke-Bereich erst nach der ersten Einlösung oder einem ausgelösten Dankeschön – Überraschung statt Lockmittel.
    dankeSichtbar: wirkung.eingeloest > 0 || dankeschoens.length > 0,
    dankeschoens,
    spendenZwecke: t['belohnung.spende.zwecke'].split('|').map((s) => s.trim()).filter(Boolean),
  };
}

export type EmpfehlerDaten = ReturnType<typeof empfehlerDaten>;
