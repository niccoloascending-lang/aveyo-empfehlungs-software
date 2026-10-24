import { admin, json, fehler } from '@/lib/admin';
import { speichereDatei } from '@/lib/dateien';

export const POST = admin(async (req) => {
  const form = await req.formData().catch(() => null);
  const f = form?.get('datei');
  if (!f || typeof f === 'string') return fehler('Keine Datei.');
  const r = await speichereDatei(f);
  return 'fehler' in r ? fehler(r.fehler) : json({ ok: true, id: r.id });
});
