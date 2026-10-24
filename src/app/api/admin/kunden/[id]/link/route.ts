import { admin, json, body, idParam } from '@/lib/admin';
import { neuerLink, linkWiderrufen } from '@/lib/kunden';
import { protokolliere } from '@/lib/db';

// Magic-Link neu erzeugen (alter wird ungültig) oder widerrufen.
export const POST = admin(async (req, b, ctx) => {
  const id = idParam(ctx);
  const d = await body(req);
  if (d.aktion === 'widerrufen') {
    linkWiderrufen(id);
    protokolliere(b.id, 'link_widerrufen', String(id));
    return json({ ok: true, link: null });
  }
  const link = neuerLink(id);
  protokolliere(b.id, 'link_neu', String(id));
  return json({ ok: true, link });
});
