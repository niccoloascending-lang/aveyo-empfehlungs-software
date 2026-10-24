// Hilfen für Admin-API-Routen.
import { NextResponse } from 'next/server';
import { aktuellerBerater, type Berater } from './auth.ts';

type Ctx = { params: Record<string, string> };

/** Route nur für angemeldete Berater (Middleware prüft schon die Signatur; hier zusätzlich gegen die DB). */
export function admin(fn: (req: Request, b: Berater, ctx: Ctx) => Promise<Response> | Response) {
  return async (req: Request, ctx: Ctx) => {
    const b = aktuellerBerater();
    if (!b) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    try {
      return await fn(req, b, ctx);
    } catch (e) {
      console.error('Admin-API:', (e as Error).message);
      return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
    }
  };
}

export const json = (d: unknown, status = 200) => NextResponse.json(d, { status });
export const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
export const body = async (req: Request): Promise<any> => req.json().catch(() => ({}));
export const idParam = (ctx: Ctx) => {
  const n = Number(ctx.params.id);
  return Number.isInteger(n) && n > 0 ? n : 0;
};
