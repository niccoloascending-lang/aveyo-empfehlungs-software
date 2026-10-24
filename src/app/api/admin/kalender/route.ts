import { admin, json } from '@/lib/admin';
import { kalenderTesten, kalenderVonBerater, kalenderAktiv, dienstkontoEmail } from '@/lib/kalender';

export const dynamic = 'force-dynamic';

// Status der Google-Kalender-Anbindung für den angemeldeten Berater
export const GET = admin(() => json({ aktiv: kalenderAktiv(), dienstkonto: dienstkontoEmail() }));

export const POST = admin(async (_req, b) => json(await kalenderTesten(kalenderVonBerater(b.id))));
