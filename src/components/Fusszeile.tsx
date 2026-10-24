import Link from 'next/link';
import { einstellungen, texte } from '@/lib/einstellungen';
import { fuelle } from '@/lib/texte';

/** Pflichtangaben auf jeder öffentlichen Seite: Impressum, Datenschutz, Erstinformation, Register. */
export default function Fusszeile() {
  const t = texte(['footer.']);
  const e = einstellungen();
  return (
    <footer className="mx-auto mt-12 max-w-xl px-4 pb-10 text-center text-sm text-tinte/70">
      <nav aria-label="Rechtliches" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <a className="underline-offset-4 hover:underline" href={e.impressumUrl || '/info/impressum'}>
          {t['footer.impressum']}
        </a>
        <a className="underline-offset-4 hover:underline" href={e.datenschutzUrl || '/info/datenschutz'}>
          {t['footer.datenschutz']}
        </a>
        {e.datenschutzUrl && (
          <Link className="underline-offset-4 hover:underline" href="/info/datenschutz">
            {t['footer.datenschutz.seite']}
          </Link>
        )}
        <Link className="underline-offset-4 hover:underline" href="/info/erstinformation">
          {t['footer.erstinformation']}
        </Link>
      </nav>
      {e.registerNr && <p className="mt-3">{fuelle(t['footer.register'], { nr: e.registerNr })}</p>}
      <p className="mt-3">© {new Date().getFullYear()} {e.theme.firmenname}</p>
    </footer>
  );
}
