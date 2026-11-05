// Ziel für Weiterleitungen zur Anmeldung. Hinter dem Webserver (Caddy) kennt die App nur ihre interne Adresse
// (z. B. localhost:3200) – deshalb gilt die öffentliche Adresse aus GESCHENK_BASE_URL, sonst die der Anfrage.

export function anmeldeUrl(basis: string | undefined, anfrageUrl: string): URL {
  const b = (basis || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/[^/\s]+/.test(b)) {
    try {
      return new URL('/admin/login', b);
    } catch {
      // ungültige Einstellung → Adresse der Anfrage
    }
  }
  return new URL('/admin/login', anfrageUrl);
}
