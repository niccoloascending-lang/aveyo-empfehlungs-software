import { NextResponse } from 'next/server';
import { kundeAusToken } from '@/lib/kunden';
import { alsGeteiltMarkieren } from '@/lib/teilungen';
import { istKanal } from '@/lib/teilen';

// Wird per sendBeacon gemeldet, wenn der Kunde auf einen Teilen-Knopf tippt. Versendet selbst nichts.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const k = kundeAusToken(params.token);
  if (!k) return NextResponse.json({ ok: false }, { status: 401 });
  let b: any = {};
  try {
    b = JSON.parse(await req.text());
  } catch {
    /* leer */
  }
  if (!istKanal(b.kanal)) return NextResponse.json({ ok: false }, { status: 400 });
  const ok = alsGeteiltMarkieren(k.id, String(b.code ?? ''), b.kanal, b.bearbeitet === true);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
