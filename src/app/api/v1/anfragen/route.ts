import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { apiErlaubt, nichtErlaubt } from '@/lib/api-key';
import { anfrageExport } from '@/lib/webhook';

export const dynamic = 'force-dynamic';

/** GET /api/v1/anfragen?seit=2026-01-01T00:00:00Z – bestätigte Freund-Anfragen fürs CRM (Abruf statt Webhook). */
export async function GET(req: Request) {
  if (!apiErlaubt(req)) return nichtErlaubt();
  const seit = new URL(req.url).searchParams.get('seit');
  const ab = seit && !Number.isNaN(Date.parse(seit)) ? new Date(seit).toISOString().replace('T', ' ').slice(0, 19) : '1970-01-01 00:00:00';
  const ids = all<{ id: number }>('SELECT id FROM anfragen WHERE bestaetigt IS NOT NULL AND geaendert >= ? ORDER BY id LIMIT 500', ab);
  return NextResponse.json({ anfragen: ids.map((r) => anfrageExport(r.id)).filter(Boolean) });
}
