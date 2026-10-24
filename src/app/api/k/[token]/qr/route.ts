import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { kundeAusToken } from '@/lib/kunden';
import { one } from '@/lib/db';
import { freundLink } from '@/lib/teilen';
import { basisUrl } from '@/lib/einstellungen';

// QR-Code (SVG) für den persönlichen Freund-Link – zum Zeigen im Gespräch.
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const k = kundeAusToken(params.token);
  const code = new URL(req.url).searchParams.get('code') ?? '';
  if (!k || !one('SELECT 1 FROM teilungen WHERE code = ? AND kunde_id = ?', code, k.id)) return new NextResponse('Nicht gefunden', { status: 404 });
  const svg = await QRCode.toString(freundLink(basisUrl(), code), { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#172545', light: '#FFFFFF' } });
  return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'private, no-store' } });
}
