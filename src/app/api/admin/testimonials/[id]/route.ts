import { admin, json, fehler, body, idParam } from '@/lib/admin';
import { run, updateRow, protokolliere } from '@/lib/db';
import { testimonialDaten } from '@/lib/testimonials-admin';

export const PUT = admin(async (req, b, ctx) => {
  const d = testimonialDaten(await body(req));
  if ('fehler' in d) return fehler(d.fehler);
  updateRow('testimonials', idParam(ctx), d);
  protokolliere(b.id, 'testimonial_geaendert', String(idParam(ctx)));
  return json({ ok: true });
});

// Löschen, z. B. bei Widerruf der Einwilligung
export const DELETE = admin((_req, b, ctx) => {
  run('DELETE FROM testimonials WHERE id = ?', idParam(ctx));
  protokolliere(b.id, 'testimonial_geloescht', String(idParam(ctx)));
  return json({ ok: true });
});
