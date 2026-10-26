import { admin, json, fehler, body } from '@/lib/admin';
import { all, insertRow, protokolliere } from '@/lib/db';
import { testimonialDaten } from '@/lib/testimonials-admin';

export const dynamic = 'force-dynamic';

export const GET = admin(() => json(all('SELECT * FROM testimonials ORDER BY reihenfolge, id')));

export const POST = admin(async (req, b) => {
  const d = testimonialDaten(await body(req));
  if ('fehler' in d) return fehler(d.fehler);
  const id = insertRow('testimonials', d);
  protokolliere(b.id, 'testimonial_angelegt', String(id));
  return json({ ok: true, id });
});
