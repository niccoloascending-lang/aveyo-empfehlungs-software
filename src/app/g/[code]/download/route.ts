import { NextRequest, NextResponse } from 'next/server';
import { freundSeite, ereignis } from '@/lib/teilungen';
import { leseDatei } from '@/lib/dateien';
import { istVorschauBot } from '@/lib/validierung';
import { basisUrl } from '@/lib/einstellungen';

// Download einlösen: zählt anonym und liefert die Datei bzw. leitet auf die druckbare Inhaltsseite.
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const s = freundSeite(params.code);
  if (!s || s.geschenk.typ !== 'download') return new NextResponse('Nicht gefunden', { status: 404 });
  if (!istVorschauBot(req.headers.get('user-agent'))) ereignis('download', s.teilung.id, s.teilung.kunde_id);
  if (s.geschenk.datei_id) {
    const d = leseDatei(s.geschenk.datei_id);
    if (d)
      return new NextResponse(new Uint8Array(d.inhalt), {
        headers: {
          'Content-Type': d.mime,
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(d.name)}`,
          'Cache-Control': 'private, no-store',
        },
      });
  }
  return NextResponse.redirect(`${basisUrl()}/g/${params.code}/inhalt`);
}
