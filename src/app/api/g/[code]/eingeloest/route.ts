import { NextResponse } from 'next/server';
import { freundSeite, ereignis } from '@/lib/teilungen';
import { istVorschauBot } from '@/lib/validierung';
import { erlaubt, clientKey } from '@/lib/bremse';

// Anonymes Zählen einer Einlösung ohne Formular (Rechner benutzt). Keine Eingaben werden übertragen.
export async function POST(req: Request, { params }: { params: { code: string } }) {
  if (!erlaubt(`einl:${clientKey(req)}`, 20, 10 * 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const s = freundSeite(params.code);
  if (!s || s.geschenk.typ !== 'rechner') return NextResponse.json({ ok: false }, { status: 404 });
  if (!istVorschauBot(req.headers.get('user-agent'))) ereignis('rechner', s.teilung.id, s.teilung.kunde_id);
  return NextResponse.json({ ok: true });
}
