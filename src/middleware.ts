import { NextRequest, NextResponse } from 'next/server';

// Nur der Admin-Bereich ist geschützt. Kunden (Magic-Link /k/…) und Freunde (/g/…) brauchen keinen Login.
// Edge-Runtime: Signatur der Sitzung per Web Crypto prüfen (kein DB-Zugriff).
const OFFEN = ['/admin/login', '/admin/setup', '/admin/2fa', '/api/admin/auth/login', '/api/admin/auth/setup', '/api/admin/auth/2fa'];

async function gueltig(token: string | undefined): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const erwartet = btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (erwartet !== sig) return false;
  try {
    const d = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return d.voll === true && d.exp > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OFFEN.includes(pathname)) return NextResponse.next();
  if (await gueltig(req.cookies.get('gs_session')?.value)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  return NextResponse.redirect(new URL('/admin/login', req.url));
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
