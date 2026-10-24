import { NextResponse } from 'next/server';
import { one } from '@/lib/db';
import { apiErlaubt, nichtErlaubt } from '@/lib/api-key';
import { kundeImportieren, linkFuer } from '@/lib/kunden';
import { istEmail, sauber, telefon, themenLesen } from '@/lib/validierung';
import { anredeLesen, anspracheLesen } from '@/lib/csv';

/**
 * POST /api/v1/kunden { vorname, nachname, email, handy?, themen?, extern_id?, anrede? (Herr/Frau), ansprache? (du/sie) }
 * – Kunde aus dem CRM anlegen/aktualisieren (Schlüssel: extern_id, sonst E-Mail).
 * Antwort enthält den persönlichen Magic-Link, damit das CRM ihn anzeigen kann. Es wird nichts verschickt.
 */
export async function POST(req: Request) {
  if (!apiErlaubt(req)) return nichtErlaubt();
  const d = await req.json().catch(() => ({}));
  const vorname = sauber(d.vorname, 80);
  const email = sauber(d.email, 200).toLowerCase();
  const handy = telefon(d.handy);
  if (!vorname || !istEmail(email) || handy === null) return NextResponse.json({ error: 'vorname und gültige email sind Pflicht' }, { status: 400 });
  const ergebnis = kundeImportieren(
    { vorname, nachname: sauber(d.nachname, 80), anrede: anredeLesen(String(d.anrede ?? '')), ansprache: anspracheLesen(String(d.ansprache ?? '')), email, handy, themen: themenLesen(d.themen).join(','), extern_id: sauber(d.extern_id, 80) || null },
    one<{ id: number }>('SELECT MIN(id) id FROM berater')?.id ?? null,
  );
  const k = one<{ id: number }>(d.extern_id ? 'SELECT id FROM kunden WHERE extern_id = ?' : 'SELECT id FROM kunden WHERE lower(email) = ?', d.extern_id ? sauber(d.extern_id, 80) : email)!;
  return NextResponse.json({ ok: true, ergebnis, id: k.id, link: linkFuer(k.id) });
}
