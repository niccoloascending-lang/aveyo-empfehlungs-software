import { NextResponse } from 'next/server';
import { freundSeite } from '@/lib/teilungen';
import { freieTermine } from '@/lib/anfragen';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const s = freundSeite(params.code);
  if (!s || s.geschenk.typ !== 'termin') return NextResponse.json({ slots: [] }, { status: 404 });
  return NextResponse.json({ slots: await freieTermine(s.berater?.id ?? null) }, { headers: { 'Cache-Control': 'no-store' } });
}
