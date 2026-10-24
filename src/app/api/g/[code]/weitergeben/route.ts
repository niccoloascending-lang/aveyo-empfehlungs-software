import { NextResponse } from 'next/server';
import { freundSeite, weitergabeAnlegen } from '@/lib/teilungen';
import { sauber } from '@/lib/validierung';
import { erlaubt, clientKey } from '@/lib/bremse';
import { basisUrl } from '@/lib/einstellungen';
import { freundLink } from '@/lib/teilen';

// Freund gibt das Geschenk weiter: neuer Link, optional mit seinem Vornamen. Keine Daten Dritter.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  if (!erlaubt(`weiter:${clientKey(req)}`, 10, 10 * 60_000)) return NextResponse.json({ fehler: 'Zu viele Versuche.' }, { status: 429 });
  const s = freundSeite(params.code);
  if (!s) return NextResponse.json({ fehler: 'Geschenk nicht gefunden.' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const name = sauber(b.vonName, 40).split(/\s+/)[0] ?? '';
  const { code } = weitergabeAnlegen(s.teilung, name);
  return NextResponse.json({ ok: true, link: freundLink(basisUrl(), code) });
}
