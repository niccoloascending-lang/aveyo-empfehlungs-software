// CRM-Übergabe per Webhook: JSON + HMAC-SHA256-Signatur. Rein → testbar.
import crypto from 'node:crypto';

export function signatur(body: string, secret: string, zeit: number): string {
  return crypto.createHmac('sha256', secret).update(`${zeit}.${body}`).digest('hex');
}

/** Header für den Empfänger: Zeitstempel + Signatur (Schutz vor Wiedereinspielen: Empfänger prüft Alter). */
export function webhookHeader(body: string, secret: string, zeit = Math.floor(Date.now() / 1000)): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Geschenk-Zeit': String(zeit),
    'X-Geschenk-Signatur': `sha256=${signatur(body, secret, zeit)}`,
  };
}

/** Prüfung beim Empfänger (Beispiel für das eigene CRM). */
export function pruefeWebhook(body: string, secret: string, zeitHeader: string, sigHeader: string, jetzt = Math.floor(Date.now() / 1000), toleranz = 300): boolean {
  const zeit = Number(zeitHeader);
  if (!Number.isFinite(zeit) || Math.abs(jetzt - zeit) > toleranz) return false;
  const erwartet = `sha256=${signatur(body, secret, zeit)}`;
  const a = Buffer.from(erwartet);
  const b = Buffer.from(sigHeader || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Nächster Versuch: 1, 5, 30 Minuten, 2 h, 12 h; danach aufgeben. */
export function naechsterVersuch(versuche: number): number | null {
  const plan = [1, 5, 30, 120, 720];
  return versuche < plan.length ? plan[versuche] * 60000 : null;
}
