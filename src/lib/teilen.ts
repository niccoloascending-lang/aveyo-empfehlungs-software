// Teilen über die eigenen Apps des Kunden. Die App selbst verschickt nie etwas an Freunde (UWG § 7):
// Wir bauen nur Links, die WhatsApp/Telegram/Mail-Client auf dem Gerät des Kunden öffnen. Rein → testbar.
import { fuelle } from './texte.ts';

export const TOENE = ['locker', 'kurz', 'ausfuehrlich'] as const;
export type Ton = (typeof TOENE)[number];

export const KANAELE = ['whatsapp', 'signal', 'telegram', 'email', 'kopieren', 'nativ', 'qr'] as const;
export type Kanal = (typeof KANAELE)[number];

export const istKanal = (k: unknown): k is Kanal => typeof k === 'string' && (KANAELE as readonly string[]).includes(k);
export const istTon = (t: unknown): t is Ton => typeof t === 'string' && (TOENE as readonly string[]).includes(t);

export type Vorlage = { id: number; ton: Ton; variante: string; text: string; aktiv: number | boolean };

/**
 * A/B-Test: Aus den aktiven Varianten eines Tons eine zufällig wählen (gleichverteilt).
 * `zufall` ∈ [0,1) wird hereingereicht, damit es testbar bleibt.
 */
export function waehleVariante(vorlagen: Vorlage[], ton: Ton, zufall: number): Vorlage | null {
  const kandidaten = vorlagen.filter((v) => v.ton === ton && v.aktiv);
  if (!kandidaten.length) return null;
  const i = Math.min(kandidaten.length - 1, Math.floor(Math.max(0, zufall) * kandidaten.length));
  return kandidaten[i];
}

export type NachrichtVars = { geschenk: string; geschenkSatz?: string; link: string; absender?: string; zitat?: string };

/** Geschenk so, wie es im Satz steht: „Lisa schenkt dir einen persönlichen PKV-Beitragscheck“. Ohne Pflege: der Titel. */
export const imSatz = (g: { titel: string; akkusativ?: string | null }) => (g.akkusativ ?? '').trim() || g.titel;

/** Nachricht füllen. Steht {link} nicht in der Vorlage, wird der Link angehängt – ohne Link wäre das Teilen sinnlos. */
export function baueNachricht(vorlage: string, v: NachrichtVars): string {
  const text = fuelle(vorlage, { geschenk: v.geschenk, geschenk_satz: v.geschenkSatz || v.geschenk, link: v.link, absender: v.absender ?? '', zitat: v.zitat ?? '' }).trim();
  return text.includes(v.link) ? text : `${text} ${v.link}`.trim();
}

/** Zielsadresse je Kanal. `null` = nur über Kopieren/native Teilen-Funktion möglich (Signal hat keinen Web-Teilen-Link). */
export function teilenUrl(kanal: Kanal, nachricht: string, link: string, betreff = ''): string | null {
  const e = encodeURIComponent;
  switch (kanal) {
    case 'whatsapp':
      return `https://wa.me/?text=${e(nachricht)}`;
    case 'telegram': {
      const ohneLink = nachricht.replace(link, '').trim();
      return `https://t.me/share/url?url=${e(link)}&text=${e(ohneLink)}`;
    }
    case 'email':
      return `mailto:?subject=${e(betreff)}&body=${e(nachricht)}`;
    default:
      return null;
  }
}

export const freundLink = (basis: string, code: string) => `${basis.replace(/\/+$/, '')}/g/${code}`;
export const kundenLink = (basis: string, token: string) => `${basis.replace(/\/+$/, '')}/k/${token}`;

/** Zitat des Empfehlers säubern: eine Zeile, max. 160 Zeichen, keine Links/Kontaktdaten (es erscheint öffentlich). */
export function saeubereZitat(z: unknown): string {
  if (typeof z !== 'string') return '';
  let s = z.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/\S+@\S+\.\S+/g, '').replace(/\+?\d[\d\s/()-]{6,}\d/g, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s.slice(0, 160);
}
