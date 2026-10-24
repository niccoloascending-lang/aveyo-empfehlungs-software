import { NextResponse } from 'next/server';
import { kundeAusToken } from '@/lib/kunden';
import { one, run } from '@/lib/db';
import { texte, einstellungen } from '@/lib/einstellungen';

// Empfehler wählt den Spendenzweck für ein ausgelöstes Dankeschön.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const k = kundeAusToken(params.token);
  if (!k) return NextResponse.json({ ok: false }, { status: 401 });
  if (!einstellungen().belohnungen.spende) return NextResponse.json({ ok: false }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const zwecke = texte(['belohnung.spende.zwecke'])['belohnung.spende.zwecke'].split('|').map((s) => s.trim());
  if (!zwecke.includes(b.zweck)) return NextResponse.json({ ok: false }, { status: 400 });
  const d = one<{ id: number }>("SELECT id FROM dankeschoens WHERE id = ? AND kunde_id = ? AND art = 'spende'", Number(b.id), k.id);
  if (!d) return NextResponse.json({ ok: false }, { status: 404 });
  run('UPDATE dankeschoens SET spende_zweck = ? WHERE id = ?', b.zweck, d.id);
  return NextResponse.json({ ok: true });
}
