import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { admin, idParam } from '@/lib/admin';
import { linkFuer } from '@/lib/kunden';

export const dynamic = 'force-dynamic';

// QR-Code zum persönlichen Link des Kunden – zum Scannen direkt im Termin.
export const GET = admin(async (_req, _b, ctx) => {
  const link = linkFuer(idParam(ctx));
  if (!link) return new NextResponse('Kein gültiger Link', { status: 404 });
  const svg = await QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#172545', light: '#FFFFFF' } });
  return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'private, no-store' } });
});
