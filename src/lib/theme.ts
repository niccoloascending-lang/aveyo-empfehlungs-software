// Branding über Theme-Variablen (Farben, Schrift, Logo) – im Admin änderbar. Rein → testbar.

export type Theme = {
  marke: string;
  markeDunkel: string;
  markeHell: string;
  akzent: string;
  papier: string;
  tinte: string;
  schrift: string;
  logoDateiId: number | null;
  firmenname: string;
};

// AVEYO Brand Guidelines: Navy #172545, Taupe #8B806F, Sand #B3AE9A, Schrift Proxima Nova.
// Im Admin änderbar. Hell-/Dunkeltöne sind aus der Palette abgeleitet (Kontrast WCAG AA).
export const STANDARD_THEME: Theme = {
  marke: '#172545',
  markeDunkel: '#0E1830',
  markeHell: '#ECEAE3',
  akzent: '#8B806F',
  papier: '#FAF9F6',
  tinte: '#172545',
  schrift: "'Proxima Nova'",
  logoDateiId: null,
  firmenname: 'AVEYO',
};

export function hexZuRgb(hex: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Relative Leuchtdichte (WCAG) für Kontrastprüfung im Admin. */
function luminanz(hex: string): number {
  const rgb = (hexZuRgb(hex) ?? '0 0 0').split(' ').map((x) => Number(x) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function kontrast(a: string, b: string): number {
  const [x, y] = [luminanz(a), luminanz(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

const SICHERE_SCHRIFT = /^[A-Za-z0-9 ,'"-]{1,80}$/;

export function themeCss(t: Partial<Theme>): string {
  const th = { ...STANDARD_THEME, ...t };
  const v = (name: string, hex: string, fallback: string) => `--${name}: ${hexZuRgb(hex) ?? hexZuRgb(fallback)};`;
  const schrift = SICHERE_SCHRIFT.test(th.schrift) ? th.schrift : STANDARD_THEME.schrift;
  return `:root{${v('marke', th.marke, STANDARD_THEME.marke)}${v('marke-dunkel', th.markeDunkel, STANDARD_THEME.markeDunkel)}${v(
    'marke-hell',
    th.markeHell,
    STANDARD_THEME.markeHell,
  )}${v('akzent', th.akzent, STANDARD_THEME.akzent)}${v('papier', th.papier, STANDARD_THEME.papier)}${v('tinte', th.tinte, STANDARD_THEME.tinte)}--schrift: ${schrift};}`;
}
