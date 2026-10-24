import { admin, json } from '@/lib/admin';
import { anfragenListe, istStatus } from '@/lib/anfragen';

export const dynamic = 'force-dynamic';

export const GET = admin((req) => {
  const s = new URL(req.url).searchParams.get('status');
  return json(anfragenListe(istStatus(s) ? s : undefined));
});
