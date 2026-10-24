import { NextResponse } from 'next/server';
import { doiBestaetigen } from '@/lib/anfragen';
import { erlaubt, clientKey } from '@/lib/bremse';

// Double-Opt-in: nur per POST (Klick des Freundes), damit Mail-Scanner nicht automatisch bestätigen.
export async function POST(req: Request) {
  if (!erlaubt(`doi:${clientKey(req)}`, 20, 10 * 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const r = await doiBestaetigen(b.token);
  if (!r) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true, ...r });
}
