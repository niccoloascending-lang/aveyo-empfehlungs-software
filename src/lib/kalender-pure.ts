// Google-Kalender ohne Zusatzbibliothek: Dienstkonto-JWT (RS256), Anfragen für frei/belegt und Termin-Eintrag. Rein → testbar.
import crypto from 'node:crypto';

export type Dienstkonto = { client_email: string; private_key: string };

export const SCOPE = 'https://www.googleapis.com/auth/calendar';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Signierte Anmeldung des Dienstkontos (OAuth 2.0 JWT Bearer, RFC 7523). */
export function jwtAssertion(sa: Dienstkonto, jetztSek = Math.floor(Date.now() / 1000), scope = SCOPE): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const kopf = b64({ alg: 'RS256', typ: 'JWT' });
  const daten = b64({ iss: sa.client_email, scope, aud: TOKEN_URL, iat: jetztSek, exp: jetztSek + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(`${kopf}.${daten}`).sign(sa.private_key).toString('base64url');
  return `${kopf}.${daten}.${sig}`;
}

export function istDienstkonto(x: unknown): x is Dienstkonto {
  const o = x as Dienstkonto;
  return !!o && typeof o.client_email === 'string' && typeof o.private_key === 'string' && o.private_key.includes('PRIVATE KEY');
}

/** Body für POST /calendar/v3/freeBusy */
export const freeBusyAnfrage = (kalenderId: string, von: Date, bis: Date) => ({
  timeMin: von.toISOString(),
  timeMax: bis.toISOString(),
  timeZone: 'Europe/Berlin',
  items: [{ id: kalenderId }],
});

/** Belegte Zeiträume aus der Antwort lesen. Fehler des Kalenders → null (Aufrufer entscheidet). */
export function belegtAusAntwort(antwort: any, kalenderId: string): { start: string; end: string }[] | null {
  const k = antwort?.calendars?.[kalenderId];
  if (!k || (Array.isArray(k.errors) && k.errors.length)) return null;
  return (Array.isArray(k.busy) ? k.busy : []).filter((b: any) => typeof b?.start === 'string' && typeof b?.end === 'string');
}

export const BUERO = 'AVEYO GmbH, Hartwicusstraße 3, 22087 Hamburg';

export type TerminEintrag = {
  start: string; // UTC-ISO
  dauerMin: number;
  vorname: string;
  nachname?: string | null;
  email: string;
  telefon?: string | null;
  ort: 'online' | 'hamburg' | string;
  geschenk: string;
  empfehler?: string | null;
  adminLink: string;
};

/** Termin für den Kalender des Beraters. Keine Einladung an den Freund (der bekommt unsere Bestätigungs-Mail). */
export function eventDaten(t: TerminEintrag) {
  const ende = new Date(Date.parse(t.start) + t.dauerMin * 60000).toISOString();
  const name = [t.vorname, t.nachname].filter(Boolean).join(' ');
  return {
    summary: `🎁 ${t.geschenk}: ${name}`,
    description: [
      `Geschenk-Termin (${t.ort === 'hamburg' ? 'vor Ort Hamburg' : 'online'})`,
      `Freund: ${name}`,
      `E-Mail: ${t.email}`,
      t.telefon ? `Telefon (freiwillig angegeben): ${t.telefon}` : 'Kein Telefon angegeben – bitte nicht anrufen.',
      t.empfehler ? `Empfohlen von: ${t.empfehler}` : '',
      `Details: ${t.adminLink}`,
    ]
      .filter(Boolean)
      .join('\n'),
    start: { dateTime: t.start, timeZone: 'Europe/Berlin' },
    end: { dateTime: ende, timeZone: 'Europe/Berlin' },
    location: t.ort === 'hamburg' ? BUERO : 'Online (Video)',
    reminders: { useDefault: true },
  };
}
