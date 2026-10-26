import fs from 'node:fs';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { dateiInfo, istVideo, leseDatei } from '@/lib/dateien';
import { parseRange } from '@/lib/range';

// Öffentliche Dateien: Geschenkbilder, Beraterfotos, Logo, Download-Dateien, Testimonial-Videos.
// Videos werden stückweise ausgeliefert (Range), damit sie sofort starten und auf dem iPhone laufen.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse('Nicht gefunden', { status: 404 });
  const info = dateiInfo(id);
  if (!info) return new NextResponse('Nicht gefunden', { status: 404 });
  const kopf = {
    'Content-Type': info.mime,
    'Cache-Control': 'public, max-age=86400',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(info.name)}`,
  };
  if (istVideo(info.mime)) {
    const r = parseRange(req.headers.get('range'), info.groesse);
    if (r === 'ungueltig') return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${info.groesse}` } });
    const { start, ende } = r ?? { start: 0, ende: info.groesse - 1 };
    const strom = Readable.toWeb(fs.createReadStream(info.pfad, { start, end: ende })) as ReadableStream;
    return new NextResponse(strom, {
      status: r ? 206 : 200,
      headers: { ...kopf, 'Accept-Ranges': 'bytes', 'Content-Length': String(ende - start + 1), ...(r ? { 'Content-Range': `bytes ${start}-${ende}/${info.groesse}` } : {}) },
    });
  }
  const d = leseDatei(id)!;
  return new NextResponse(new Uint8Array(d.inhalt), { headers: kopf });
}
