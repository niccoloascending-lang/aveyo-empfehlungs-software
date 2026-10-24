import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FreundAnsicht from '@/components/FreundAnsicht';
import { kundeAusToken } from '@/lib/kunden';
import { freundSeite } from '@/lib/teilungen';
import { freundProps } from '@/lib/oeffentlich';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

/** Vorschau für den Empfehler: exakt die Freund-Seite seines Links, ohne Zählen und ohne Einlösen. */
export default function Vorschau({ params, searchParams }: { params: { token: string }; searchParams: { code?: string } }) {
  const kunde = kundeAusToken(params.token);
  const s = kunde ? freundSeite(searchParams.code) : null;
  if (!kunde || !s || s.teilung.kunde_id !== kunde.id) notFound();
  return <FreundAnsicht {...freundProps(s)} vorschau />;
}
