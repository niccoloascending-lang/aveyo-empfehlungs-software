'use client';
import Link from 'next/link';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten, datum } from '@/components/admin/api';
import { Meldung } from '@/components/admin/ui';

const ART: Record<string, string> = { nachricht: 'Danke-Nachricht', spende: 'Spende', erlebnis: 'Erlebnis', doppelt: 'Doppeltes Geschenk' };

export default function Dankeschoen() {
  const { daten, laden } = useDaten<{ offen: any[]; vorschlaege: any[] }>('/api/admin/dankeschoen');
  return (
    <Shell titel="Dankeschön">
      <Meldung art="info" text="Belohnung ist nie der Grund fürs Teilen, sondern eine Überraschung danach. Hier siehst du, wem du noch Danke sagen könntest, und offene Dankeschöns." />
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <section className="a-karte">
          <h2 className="mb-3 font-semibold">Noch kein Danke bekommen</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {(daten?.vorschlaege ?? []).map((k) => (
              <li key={k.id} className="flex items-center justify-between py-2">
                <span>
                  {k.vorname} {k.nachname} · {k.eingeloest} × eingelöst
                </span>
                <Link className="a-btn2" href={`/admin/kunden/${k.id}`}>
                  Danke sagen
                </Link>
              </li>
            ))}
          </ul>
          {daten && !daten.vorschlaege.length && <p className="text-sm text-slate-500">Niemand offen.</p>}
        </section>
        <section className="a-karte">
          <h2 className="mb-3 font-semibold">Offene Dankeschöns</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {(daten?.offen ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  <Link className="font-medium underline" href={`/admin/kunden/${d.kunde_id}`}>
                    {d.vorname} {d.nachname}
                  </Link>{' '}
                  · {ART[d.art]} · {datum(d.erstellt)}
                  {d.spende_zweck && <> · Zweck: {d.spende_zweck}</>}
                </span>
                <button
                  className="a-btn2"
                  onClick={async () => {
                    await anfrage(`/api/admin/dankeschoen/${d.id}`, 'PUT', { status: 'erledigt' });
                    laden();
                  }}
                >
                  Erledigt
                </button>
              </li>
            ))}
          </ul>
          {daten && !daten.offen.length && <p className="text-sm text-slate-500">Nichts offen.</p>}
        </section>
      </div>
    </Shell>
  );
}
