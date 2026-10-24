import { admin, json } from '@/lib/admin';
import { postausgang } from '@/lib/mail';

export const dynamic = 'force-dynamic';

// Nur ohne SMTP (Entwicklung): Mails landen im Datenordner und sind hier lesbar.
export const GET = admin(() => json({ aktiv: !process.env.SMTP_HOST, mails: process.env.SMTP_HOST ? [] : postausgang() }));
