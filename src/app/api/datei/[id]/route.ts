import { NextResponse } from 'next/server';
import { leseDatei } from '@/lib/dateien';

// Öffentliche Dateien: Geschenkbilder, Beraterfotos, Logo, Download-Dateien.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const d = Number.isInteger(id) && id > 0 ? leseDatei(id) : null;
  if (!d) return new NextResponse('Nicht gefunden', { status: 404 });
  return new NextResponse(new Uint8Array(d.inhalt), {
    headers: { 'Content-Type': d.mime, 'Cache-Control': 'public, max-age=86400', 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(d.name)}` },
  });
}
