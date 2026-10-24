import type { Config } from 'tailwindcss';

// Markenfarben kommen aus CSS-Variablen (Theme im Admin änderbar, siehe src/lib/theme.ts).
const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        marke: { DEFAULT: v('marke'), dunkel: v('marke-dunkel'), hell: v('marke-hell') },
        akzent: v('akzent'),
        papier: v('papier'),
        tinte: v('tinte'),
      },
      fontFamily: { sans: ['var(--schrift)', 'system-ui', 'Segoe UI', 'sans-serif'] },
      boxShadow: { karte: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px -8px rgba(0,0,0,.12)' },
    },
  },
  plugins: [],
};
export default config;
