import type { Metadata, Viewport } from 'next';
import './globals.css';
import { einstellungen, basisUrl } from '@/lib/einstellungen';
import { themeCss } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const e = einstellungen();
  return {
    metadataBase: new URL(basisUrl()),
    title: `${e.theme.firmenname} – Ein Geschenk für dich`,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FFFBF6' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const e = einstellungen();
  return (
    <html lang="de">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss(e.theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
