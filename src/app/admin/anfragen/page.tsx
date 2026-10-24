'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten, datum } from '@/components/admin/api';
import { Meldung, STATUS_FARBE } from '@/components/admin/ui';

const STATUS = [
  ['neu', 'Neu'],
  ['termin', 'Termin'],
  ['beratung', 'Beratung'],
  ['kunde', 'Kunde'],
  ['kein_interesse', 'Kein Interesse'],
] as const;
const TYP: Record<string, string> = { termin: 'Termin', download_mail: 'Download per Mail', auswertung: 'Rechner-Auswertung' };
const ORT: Record<string, string> = { online: 'Online', hamburg: 'Hamburg' };

const terminText = (iso: string) =>
  new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export default function Anfragen() {
  const [filter, setFilter] = useState('');
  useEffect(() => {
    setFilter(new URLSearchParams(window.location.search).get('status') ?? '');
  }, []);
  const { daten, laden } = useDaten<any[]>(`/api/admin/anfragen${filter ? `?status=${filter}` : ''}`);
  const [offen, setOffen] = useState<number | null>(null);

  const status = async (id: number, s: string) => {
    await anfrage(`/api/admin/anfragen/${id}`, 'PUT', { status: s });
    laden();
  };

  return (
    <Shell titel="Freund-Anfragen">
      <div className="mb-4 flex flex-wrap gap-2">
        {[['', 'Alle'], ...STATUS].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`rounded-full border px-3 py-1.5 text-sm ${filter === v ? 'border-marke bg-marke-hell' : 'border-slate-300 bg-white'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {(daten ?? []).map((a) => (
          <div key={a.id} className="a-karte">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {a.vorname || '(ohne Namen)'} {a.nachname}
                  {!a.bestaetigt && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-900">E-Mail noch nicht bestätigt</span>}
                </p>
                <p className="text-sm text-slate-600">
                  {TYP[a.typ]} · {a.geschenk}
                  {a.termin_start && (
                    <>
                      {' '}
                      · <strong>{terminText(a.termin_start)}</strong> ({ORT[a.termin_ort] ?? a.termin_ort})
                    </>
                  )}
                </p>
                <p className="text-sm text-slate-600">
                  {a.email}
                  {a.telefon && <> · {a.telefon} (freiwillig angegeben)</>}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Eingegangen {datum(a.erstellt)} · Empfohlen von{' '}
                  {a.empfehler_id ? (
                    <Link className="underline" href={`/admin/kunden/${a.empfehler_id}`}>
                      {a.empfehler}
                    </Link>
                  ) : (
                    a.empfehler || '–'
                  )}
                  {a.empfehler_info ? ' · darf es erfahren' : ' · Empfehler sieht keinen Namen'}
                  {a.crm_status && ` · CRM: ${a.crm_status}`}
                </p>
              </div>
              <select
                aria-label="Status"
                className={`rounded-full border-0 px-3 py-1.5 text-sm font-medium ${STATUS_FARBE[a.status]}`}
                value={a.status}
                onChange={(e) => status(a.id, e.target.value)}
              >
                {STATUS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button className="mt-2 text-xs text-slate-500 underline" onClick={() => setOffen(offen === a.id ? null : a.id)}>
              {offen === a.id ? 'Weniger' : 'Details, Einwilligungen, Notiz'}
            </button>
            {offen === a.id && <Details a={a} geaendert={laden} />}
          </div>
        ))}
        {daten && !daten.length && <p className="text-sm text-slate-500">Keine Anfragen.</p>}
      </div>
    </Shell>
  );
}

function Details({ a, geaendert }: { a: any; geaendert: () => void }) {
  const { daten } = useDaten<{ einwilligungen: any[] }>(`/api/admin/anfragen/${a.id}`);
  const [notiz, setNotiz] = useState(a.notiz ?? '');
  const [ok, setOk] = useState('');
  const rechner = a.daten ? JSON.parse(a.daten) : null;
  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-sm">
      {rechner && (
        <p>
          <strong>Rechner-Eingaben (vom Freund mitgeschickt):</strong> Alter {rechner.alter}, Rente mit {rechner.rentenalter}, Netto {rechner.netto} €, erwartete Rente {rechner.rente} €, Ziel{' '}
          {rechner.zielProzent} %, Inflation {rechner.inflation} %
        </p>
      )}
      <div>
        <p className="font-medium">Einwilligungen</p>
        <ul className="mt-1 space-y-1">
          {(daten?.einwilligungen ?? []).map((e, i) => (
            <li key={i} className="text-xs">
              <strong>{e.art}</strong>: „{e.wortlaut}“ · erteilt {datum(e.erteilt)}
              {e.bestaetigt && ` · bestätigt ${datum(e.bestaetigt)}`}
              {e.widerrufen && ` · widerrufen ${datum(e.widerrufen)}`}
            </li>
          ))}
        </ul>
      </div>
      <textarea className="a-input" rows={2} placeholder="Interne Notiz" value={notiz} onChange={(e) => setNotiz(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button
          className="a-btn2"
          onClick={async () => {
            await anfrage(`/api/admin/anfragen/${a.id}`, 'PUT', { notiz });
            setOk('Gespeichert');
          }}
        >
          Notiz speichern
        </button>
        {!!a.empfehler_info && (
          <button
            className="a-btn2"
            onClick={async () => {
              await anfrage(`/api/admin/anfragen/${a.id}`, 'PUT', { empfehlerInfoWiderrufen: true });
              geaendert();
            }}
          >
            Einwilligung „Empfehler informieren“ widerrufen
          </button>
        )}
        <button
          className="a-btn2 text-red-700"
          onClick={async () => {
            if (!confirm('Anfrage endgültig löschen?')) return;
            await anfrage(`/api/admin/anfragen/${a.id}`, 'DELETE');
            geaendert();
          }}
        >
          Löschen
        </button>
      </div>
      <Meldung text={ok} art="ok" />
    </div>
  );
}
