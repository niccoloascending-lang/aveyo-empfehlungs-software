// REST-API für das bestehende CRM: Bearer-API-Key (im Admin erzeugt, nur als Hash gespeichert).
import { NextResponse } from 'next/server';
import { einstellungen } from './einstellungen.ts';
import { hashToken, gleich } from './token.ts';

export function apiErlaubt(req: Request): boolean {
  const h = req.headers.get('authorization') ?? '';
  const key = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  const soll = einstellungen().apiKeyHash;
  return !!key && !!soll && gleich(hashToken(key), soll);
}

export const nichtErlaubt = () => NextResponse.json({ error: 'API-Key fehlt oder ist falsch' }, { status: 401 });
