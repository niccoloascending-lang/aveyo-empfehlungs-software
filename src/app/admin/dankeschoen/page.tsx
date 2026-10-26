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
      <Zusagen />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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

/** A/B-Test: zugesagte Spenden (A) und Gutscheine (B) abarbeiten. */
function Zusagen() {
  const { daten, laden } = useDaten<{ offen: any[]; summen: { art: string; zweck: string; status: string; anzahl: number; summe: number }[] }>('/api/admin/zusagen');
  const spenden = (daten?.offen ?? []).filter((z) => z.art === 'spende');
  const praemien = (daten?.offen ?? []).filter((z) => z.art === 'praemie');
  const jeZweck = new Map<string, number>();
  for (const z of spenden) jeZweck.set(z.zweck, (jeZweck.get(z.zweck) ?? 0) + z.betrag);
  const erledigt = async (b: Record<string, unknown>) => {
    await anfrage('/api/admin/zusagen', 'PUT', b);
    laden();
  };
  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <section className="a-karte">
        <h2 className="mb-1 font-semibold">Offene Spenden (Gruppe A)</h2>
        <p className="mb-3 text-xs text-slate-500">Je eingelöstem Geschenk, an den Zweck, den der Kunde gewählt hat. Gesammelt überweisen, dann abhaken.</p>
        {[...jeZweck.entries()].map(([zweck, summe]) => (
          <div key={zweck} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
            <span>
              {zweck}: <strong>{summe} €</strong>
            </span>
            <button className="a-btn2" onClick={() => erledigt({ art: 'spende', zweck })}>
              Gespendet
            </button>
          </div>
        ))}
        {!spenden.length && <p className="text-sm text-slate-500">Nichts offen.</p>}
      </section>
      <section className="a-karte">
        <h2 className="mb-1 font-semibold">Offene Gutscheine (Gruppe B)</h2>
        <p className="mb-3 text-xs text-slate-500">Je stattgefundenem Gespräch eines empfohlenen Freundes. Gutschein selbst verschicken, dann abhaken.</p>
        <ul className="divide-y divide-slate-100 text-sm">
          {praemien.map((z) => (
            <li key={z.id} className="flex items-center justify-between gap-2 py-2">
              <span>
                <Link className="font-medium underline" href={`/admin/kunden/${z.kunde_id}`}>
                  {z.vorname} {z.nachname}
                </Link>{' '}
                · {z.betrag} € · {datum(z.erstellt)}
              </span>
              <button className="a-btn2" onClick={() => erledigt({ id: z.id })}>
                Verschickt
              </button>
            </li>
          ))}
        </ul>
        {!praemien.length && <p className="text-sm text-slate-500">Nichts offen.</p>}
      </section>
    </div>
  );
}
