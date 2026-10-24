import { NextResponse } from 'next/server';
import { freundSeite } from '@/lib/teilungen';
import { anfrageAnlegen, freieTermine, type AnfrageTyp } from '@/lib/anfragen';
import { aktivAngehakt } from '@/lib/einwilligung';
import { istEmail, sauber, telefon } from '@/lib/validierung';
import { pruefeEingabe } from '@/lib/rechner';
import { erlaubt, clientKey } from '@/lib/bremse';
import { einstellungen, texte } from '@/lib/einstellungen';

const TYPEN: Record<string, AnfrageTyp> = { termin: 'termin', download_mail: 'download_mail', auswertung: 'auswertung' };

// Freund fordert selbst etwas an. Nur seine eigenen Angaben, Datenschutz-Häkchen Pflicht, Empfehler-Info freiwillig.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  if (!erlaubt(`anfrage:${clientKey(req)}`, 8, 10 * 60_000)) return NextResponse.json({ fehler: 'Zu viele Versuche. Bitte später noch einmal.' }, { status: 429 });
  const s = freundSeite(params.code);
  if (!s) return NextResponse.json({ fehler: 'Geschenk nicht gefunden.' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const typ = TYPEN[b.typ];
  if (!typ) return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });
  // Passt die Anfrage zum Geschenk?
  const passt = (typ === 'termin' && s.geschenk.typ === 'termin') || (typ === 'download_mail' && s.geschenk.typ === 'download') || (typ === 'auswertung' && s.geschenk.typ === 'rechner');
  if (!passt) return NextResponse.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 });

  const pflicht = texte(['freund.form'])['freund.form.pflicht'];
  const vorname = sauber(b.vorname, 80);
  const email = sauber(b.email, 200);
  const tel = telefon(b.telefon);
  if (!aktivAngehakt(b.datenschutz) || !istEmail(email) || (typ !== 'download_mail' && !vorname)) return NextResponse.json({ fehler: pflicht }, { status: 400 });
  if (tel === null) return NextResponse.json({ fehler: 'Bitte die Telefonnummer prüfen oder leer lassen.' }, { status: 400 });

  let termin_start: string | undefined;
  let termin_ort: string | undefined;
  if (typ === 'termin') {
    termin_start = typeof b.termin_start === 'string' ? b.termin_start : '';
    const orte = einstellungen().verfuegbarkeit.orte;
    termin_ort = orte.includes(b.termin_ort) ? b.termin_ort : orte[0] ?? 'online';
    if (!(await freieTermine(s.berater?.id ?? null)).includes(termin_start!)) return NextResponse.json({ fehler: 'Dieser Termin ist leider nicht mehr frei. Bitte wähle einen anderen.', belegt: true }, { status: 409 });
  }
  let daten: string | undefined;
  if (typ === 'auswertung' && b.daten) {
    const r = pruefeEingabe(b.daten);
    if ('eingabe' in r) daten = JSON.stringify(r.eingabe);
  }

  const r = await anfrageAnlegen(s, {
    typ,
    vorname,
    nachname: sauber(b.nachname, 80),
    email,
    telefon: tel || undefined,
    termin_start,
    termin_ort,
    daten,
    empfehlerInfo: aktivAngehakt(b.empfehlerInfo),
  });
  if ('fehler' in r) return NextResponse.json({ fehler: r.fehler, belegt: true }, { status: 409 });
  return NextResponse.json({ ok: true });
}
