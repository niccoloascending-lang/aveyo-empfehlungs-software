import { NextResponse } from 'next/server';
import { kundeAusToken } from '@/lib/kunden';
import { run } from '@/lib/db';
import { spendenZwecke } from '@/lib/zusagen';

// Gruppe A: Kunde wählt, wofür in seinem Namen gespendet wird (gilt für künftige Einlösungen).
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const k = kundeAusToken(params.token);
  if (!k) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!spendenZwecke().some((z) => z.name === b.zweck)) return NextResponse.json({ ok: false }, { status: 400 });
  run('UPDATE kunden SET spendenzweck = ? WHERE id = ?', b.zweck, k.id);
  return NextResponse.json({ ok: true });
}
