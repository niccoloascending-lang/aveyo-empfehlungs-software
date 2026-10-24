import { NextResponse } from 'next/server';
import { kundeAusToken } from '@/lib/kunden';
import { teilungAnlegen, teilungAendern, geschenk } from '@/lib/teilungen';
import { istTon } from '@/lib/teilen';
import { freundLink } from '@/lib/teilen';
import { basisUrl } from '@/lib/einstellungen';
import { erlaubt } from '@/lib/bremse';
import { one } from '@/lib/db';

const anlassId = (x: unknown) => {
  const n = Number(x);
  return Number.isInteger(n) && n > 0 && one('SELECT 1 FROM anlaesse WHERE id = ?', n) ? n : null;
};

const ERSATZ = '{geschenk} – geschenkt von mir. {link}';

// Persönlichen Freund-Link anlegen (Geschenk + Zitat + Nachrichtenvorlage per A/B-Zufall)
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const k = kundeAusToken(params.token);
  if (!k) return NextResponse.json({ fehler: 'Link ungültig' }, { status: 401 });
  if (!erlaubt(`teil:${k.id}`, 60, 60 * 60_000)) return NextResponse.json({ fehler: 'Zu viele Versuche.' }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const g = geschenk(Number(b.geschenkId));
  if (!g || !g.aktiv) return NextResponse.json({ fehler: 'Geschenk nicht verfügbar' }, { status: 400 });
  const ton = istTon(b.ton) ? b.ton : 'locker';
  const { code, vorlage } = teilungAnlegen(k, g.id, ton, b.zitat, anlassId(b.anlassId));
  return NextResponse.json({ ok: true, code, link: freundLink(basisUrl(), code), vorlage: vorlage?.text ?? ERSATZ });
}

// Zitat oder Ton ändern
export async function PATCH(req: Request, { params }: { params: { token: string } }) {
  const k = kundeAusToken(params.token);
  if (!k) return NextResponse.json({ fehler: 'Link ungültig' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const r = teilungAendern(k.id, String(b.code ?? ''), { zitat: b.zitat, ton: istTon(b.ton) ? b.ton : undefined, anlassId: b.anlassId === undefined ? undefined : anlassId(b.anlassId) });
  if (!r) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({ ok: true, vorlage: r.vorlage === undefined ? undefined : r.vorlage?.text ?? ERSATZ });
}
