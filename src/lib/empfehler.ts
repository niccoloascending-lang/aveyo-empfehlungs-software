// Daten für „Mein Geschenke-Bereich“ des Empfehlers.
import { all, one, run } from './db.ts';
import { kontingent, sozialeZahl, anlaesseFuer, type Anlass } from './anreize.ts';
import { einstellungen, texte, ansprache } from './einstellungen.ts';
import { anredeName } from './texte.ts';
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

/** Kontingent eines Kunden (rollierend 12 Monate). */
export function kontingentVon(kunde: { id: number; kontingent_extra?: number | null }) {
  const geteilt = all<{ geteilt_am: string | null }>('SELECT geteilt_am FROM teilungen WHERE kunde_id = ? AND geteilt_am IS NOT NULL', kunde.id).map((r) => r.geteilt_am);
  return kontingent(einstellungen().kontingent, kunde.kontingent_extra ?? 0, geteilt);
}

const EINLOESUNG = "('download','rechner','termin_bestaetigt','auswertung_bestaetigt','download_mail_bestaetigt')";

/** Alle Einlösungen (= gepflanzte Bäume) über alle Kunden. */
export const baeumeGesamt = () => one<{ n: number }>(`SELECT COUNT(*) n FROM ereignisse WHERE typ IN ${EINLOESUNG}`)!.n;

/** Anlässe („Jemandem, der …“) und Geschenke für den Kunden. `karten` = Auswahl für „Ich weiß schon, was ich verschenken will“. */
function geschenkAuswahl(kunde: Kunde) {
  const aktive = aktiveGeschenke();
  const karten = geschenkeFuer(aktive, kunde.themen, 4);
  const anlaesse = anlaesseFuer(all<Anlass>('SELECT * FROM anlaesse'), kunde.themen, aktive.map((g) => g.id));
  const noetig = new Set([...karten.map((g) => g.id), ...anlaesse.flatMap((a) => a.geschenkIds)]);
  return {
    geschenke: aktive
      .filter((g) => noetig.has(g.id))
      .map((g) => ({ id: g.id, titel: g.titel, satz: imSatz(g), kurz: g.kurz, icon: g.icon, typ: g.typ, bild_id: g.bild_id })),
    karten: karten.map((g) => g.id),
    anlaesse: anlaesse.map((a) => ({ id: a.id, text: a.text, icon: a.icon, geschenkIds: a.geschenkIds })),
  };
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
  const form = ansprache(kunde);
  const t = texte(['kunde.', 'freund.einwilligung', 'belohnung.'], form);
  return {
    vorname: kunde.vorname,
    anredeName: anredeName(kunde, form),
    berater: b ? { name: b.name, foto_id: b.foto_id, video_url: b.video_url } : null,
    ...geschenkAuswahl(kunde),
    zitatVorschlag: (kunde.zitat_vorschlag ?? '').trim(),
    kontingent: kontingentVon(kunde),
    sozial: e.sozialAnzeigen
      ? sozialeZahl(e.sozialStartwert, one<{ n: number }>('SELECT COUNT(DISTINCT kunde_id) n FROM teilungen WHERE kunde_id IS NOT NULL AND geteilt_am IS NOT NULL')!.n)
      : null,
    baeume: e.baeume ? { eigene: wirkung.eingeloest, gesamt: baeumeGesamt() } : null,
    t,
    wirkung,
    // Danke-Bereich erst nach der ersten Einlösung oder einem ausgelösten Dankeschön – Überraschung statt Lockmittel.
    dankeSichtbar: wirkung.eingeloest > 0 || dankeschoens.length > 0,
    dankeschoens,
    spendenZwecke: t['belohnung.spende.zwecke'].split('|').map((s) => s.trim()).filter(Boolean),
  };
}

export type EmpfehlerDaten = ReturnType<typeof empfehlerDaten>;
