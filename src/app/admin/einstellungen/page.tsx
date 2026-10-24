'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/admin/Shell';
import { anfrage, hochladen, useDaten } from '@/components/admin/api';
import { Feld, KopierKnopf, Meldung } from '@/components/admin/ui';

const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function Abschnitt({ titel, children, hinweis }: { titel: string; children: React.ReactNode; hinweis?: string }) {
  return (
    <section className="a-karte space-y-3">
      <h2 className="font-semibold">{titel}</h2>
      {hinweis && <p className="text-xs text-slate-500">{hinweis}</p>}
      {children}
    </section>
  );
}

export default function Einstellungen() {
  const { daten, laden } = useDaten<any>('/api/admin/einstellungen');
  const profil = useDaten<any>('/api/admin/profil');
  const berater = useDaten<any[]>('/api/admin/berater');
  const kal = useDaten<{ aktiv: boolean; dienstkonto: string | null }>('/api/admin/kalender');
  const [e, setE] = useState<any>(null);
  const [p, setP] = useState<any>(null);
  const [meldung, setMeldung] = useState({ text: '', art: 'ok' as 'ok' | 'fehler' });
  const [geheim, setGeheim] = useState<{ apiKey?: string; webhookSecret?: string }>({});
  const [pw, setPw] = useState({ passwortAlt: '', passwortNeu: '' });
  const [neuB, setNeuB] = useState({ name: '', email: '', passwort: '' });

  useEffect(() => setE(daten), [daten]);
  useEffect(() => setP(profil.daten), [profil.daten]);
  if (!e || !p) return <Shell titel="Einstellungen">{null}</Shell>;

  const zeige = (r: any, ok = 'Gespeichert.') => {
    setMeldung(r.error ? { text: r.error, art: 'fehler' } : { text: ok, art: 'ok' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const speichern = async (teil: Record<string, unknown>) => {
    const r = await anfrage('/api/admin/einstellungen', 'PUT', teil);
    zeige(r);
    if (r.apiKey || r.webhookSecret) setGeheim({ ...geheim, ...r });
    laden();
  };
  const th = e.theme;
  const v = e.verfuegbarkeit;

  return (
    <Shell titel="Einstellungen">
      <div className="mb-4">
        <Meldung text={meldung.text} art={meldung.art} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Abschnitt titel="Mein Profil (auf der Freund-Seite sichtbar)">
          <Feld label="Name">
            <input className="a-input" value={p.name ?? ''} onChange={(x) => setP({ ...p, name: x.target.value })} />
          </Feld>
          <Feld label="Kurzvorstellung" hinweis="Ehrlich und konkret. Keine Superlative.">
            <textarea className="a-input" rows={4} value={p.vorstellung ?? ''} onChange={(x) => setP({ ...p, vorstellung: x.target.value })} />
          </Feld>
          <Feld label="Foto">
            <div className="flex items-center gap-3">
              {p.foto_id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/datei/${p.foto_id}`} alt="" className="h-12 w-12 rounded-full object-cover" />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (x) => {
                  const f = x.target.files?.[0];
                  if (!f) return;
                  const r = await hochladen(f);
                  if (r.id) setP({ ...p, foto_id: r.id });
                  else zeige(r);
                }}
              />
            </div>
          </Feld>
          <Feld label="Begrüßungsvideo (optional, https-Link)">
            <input className="a-input" value={p.video_url ?? ''} onChange={(x) => setP({ ...p, video_url: x.target.value })} />
          </Feld>
          <Feld label="Externes Buchungstool (optional, Cal.com/Calendly-Link)" hinweis="Wird nur genutzt, wenn unten „Terminbuchung: extern“ gewählt ist.">
            <input className="a-input" value={p.termin_url ?? ''} onChange={(x) => setP({ ...p, termin_url: x.target.value })} />
          </Feld>
          <Feld
            label="Google-Kalender (Kalender-ID, meist deine E-Mail)"
            hinweis={
              kal.daten?.dienstkonto
                ? `Gib deinen Kalender in Google Kalender → Einstellungen → „Für bestimmte Personen freigeben“ für ${kal.daten.dienstkonto} frei (Berechtigung: „Änderungen an Terminen vornehmen“). Belegte Zeiten werden dann ausgeblendet, bestätigte Termine eingetragen.`
                : 'Noch kein Google-Dienstkonto auf dem Server eingerichtet (siehe README → Google-Kalender).'
            }
          >
            <input className="a-input" placeholder="adrian@aveyo.de" value={p.kalender_id ?? ''} onChange={(x) => setP({ ...p, kalender_id: x.target.value })} />
          </Feld>
          <div className="flex flex-wrap gap-2">
            <button className="a-btn" onClick={async () => zeige(await anfrage('/api/admin/profil', 'PUT', p))}>
              Profil speichern
            </button>
            <button
              className="a-btn2"
              onClick={async () => {
                const r = await anfrage('/api/admin/kalender', 'POST');
                setMeldung({ text: r.text ?? r.error ?? 'Fehler', art: r.ok ? 'ok' : 'fehler' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Kalender testen
            </button>
          </div>
        </Abschnitt>

        <Abschnitt titel="Ansprache & Branding">
          <div className="flex gap-2">
            {(['du', 'sie'] as const).map((a) => (
              <button key={a} onClick={() => speichern({ anrede: a })} className={`rounded-full border px-4 py-1.5 text-sm ${e.anrede === a ? 'border-marke bg-marke-hell' : 'border-slate-300'}`}>
                {a === 'du' ? 'Du-Form' : 'Sie-Form'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['marke', 'Markenfarbe'],
              ['markeDunkel', 'Marke dunkel'],
              ['markeHell', 'Marke hell'],
              ['akzent', 'Akzent'],
              ['papier', 'Hintergrund'],
              ['tinte', 'Schrift'],
            ].map(([k, l]) => (
              <Feld key={k} label={l}>
                <div className="flex items-center gap-2">
                  <input type="color" value={th[k]} onChange={(x) => setE({ ...e, theme: { ...th, [k]: x.target.value } })} className="h-9 w-10 rounded border" aria-label={l} />
                  <input className="a-input" value={th[k]} onChange={(x) => setE({ ...e, theme: { ...th, [k]: x.target.value } })} />
                </div>
              </Feld>
            ))}
          </div>
          {e.kontrast < 4.5 && <Meldung art="info" text={`Kontrast Markenfarbe/Weiß nur ${e.kontrast}:1 – für WCAG AA mindestens 4,5:1 wählen (dunklere Markenfarbe).`} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <Feld label="Firmenname">
              <input className="a-input" value={th.firmenname} onChange={(x) => setE({ ...e, theme: { ...th, firmenname: x.target.value } })} />
            </Feld>
            <Feld label="Schrift (CSS-Schriftname)">
              <input className="a-input" value={th.schrift} onChange={(x) => setE({ ...e, theme: { ...th, schrift: x.target.value } })} />
            </Feld>
          </div>
          <Feld label="Logo (PNG/WebP)">
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={async (x) => {
                const f = x.target.files?.[0];
                if (!f) return;
                const r = await hochladen(f);
                if (r.id) setE({ ...e, theme: { ...th, logoDateiId: r.id } });
              }}
            />
          </Feld>
          <button className="a-btn" onClick={() => speichern({ theme: th })}>
            Branding speichern
          </button>
        </Abschnitt>

        <Abschnitt titel="Terminbuchung">
          <div className="flex gap-2">
            {(['eigen', 'extern'] as const).map((m) => (
              <button key={m} onClick={() => setE({ ...e, terminModus: m })} className={`rounded-full border px-4 py-1.5 text-sm ${e.terminModus === m ? 'border-marke bg-marke-hell' : 'border-slate-300'}`}>
                {m === 'eigen' ? 'Eigener Slot-Picker' : 'Extern (Cal.com/Calendly)'}
              </button>
            ))}
          </div>
          {e.terminModus === 'eigen' && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {TAGE.map((t, i) => {
                  const an = v.wochentage.includes(i + 1);
                  return (
                    <button
                      key={t}
                      onClick={() => setE({ ...e, verfuegbarkeit: { ...v, wochentage: an ? v.wochentage.filter((x: number) => x !== i + 1) : [...v.wochentage, i + 1].sort() } })}
                      className={`h-9 w-10 rounded-lg border text-sm ${an ? 'border-marke bg-marke-hell' : 'border-slate-300'}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Feld label="Von">
                  <input className="a-input" type="time" value={v.von} onChange={(x) => setE({ ...e, verfuegbarkeit: { ...v, von: x.target.value } })} />
                </Feld>
                <Feld label="Bis">
                  <input className="a-input" type="time" value={v.bis} onChange={(x) => setE({ ...e, verfuegbarkeit: { ...v, bis: x.target.value } })} />
                </Feld>
                <Feld label="Dauer (Min.)">
                  <input className="a-input" type="number" value={v.dauerMin} onChange={(x) => setE({ ...e, verfuegbarkeit: { ...v, dauerMin: Number(x.target.value) } })} />
                </Feld>
                <Feld label="Puffer (Min.)">
                  <input className="a-input" type="number" value={v.pufferMin} onChange={(x) => setE({ ...e, verfuegbarkeit: { ...v, pufferMin: Number(x.target.value) } })} />
                </Feld>
                <Feld label="Vorlauf (Std.)">
                  <input className="a-input" type="number" value={v.vorlaufStunden} onChange={(x) => setE({ ...e, verfuegbarkeit: { ...v, vorlaufStunden: Number(x.target.value) } })} />
                </Feld>
                <Feld label="Buchbar (Tage)">
                  <input className="a-input" type="number" value={v.tageVoraus} onChange={(x) => setE({ ...e, verfuegbarkeit: { ...v, tageVoraus: Number(x.target.value) } })} />
                </Feld>
              </div>
              <div className="flex gap-4 text-sm">
                {(['online', 'hamburg'] as const).map((o) => (
                  <label key={o} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={v.orte.includes(o)}
                      onChange={(x) => setE({ ...e, verfuegbarkeit: { ...v, orte: x.target.checked ? [...v.orte, o] : v.orte.filter((y: string) => y !== o) } })}
                    />
                    {o === 'online' ? 'Online' : 'Vor Ort Hamburg'}
                  </label>
                ))}
              </div>
            </>
          )}
          <button className="a-btn" onClick={() => speichern({ terminModus: e.terminModus, verfuegbarkeit: v })}>
            Termine speichern
          </button>
        </Abschnitt>

        <Abschnitt
          titel="Dankeschön-Arten"
          hinweis="⚖️ Standard: nur die persönliche Danke-Nachricht. Geldprämien und Provisionsbeteiligungen sind bewusst nicht vorgesehen (Provisionsabgabeverbot, Tippgeber-Abgrenzung). Jede Änderung hier bitte vorher rechtlich prüfen lassen. Texte unter „Texte → Dankeschön“."
        >
          {[
            ['nachricht', 'Persönliche Danke-Nachricht (manueller Versand)'],
            ['spende', 'Spende im Namen des Empfehlers (Zweck wählbar)'],
            ['erlebnis', 'Gemeinsames Erlebnis (Kaffee/Essen)'],
            ['doppelt', 'Doppeltes Geschenk nach dem ersten Termin'],
          ].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!e.belohnungen[k]} onChange={(x) => setE({ ...e, belohnungen: { ...e.belohnungen, [k]: x.target.checked } })} /> {l}
            </label>
          ))}
          <button className="a-btn" onClick={() => speichern({ belohnungen: e.belohnungen })}>
            Speichern
          </button>
        </Abschnitt>

        <Abschnitt titel="Datenschutz & Löschkonzept">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Feld label="Anfragen ohne Termin löschen nach (Monaten)">
              <input className="a-input" type="number" min={1} value={e.loeschenMonate} onChange={(x) => setE({ ...e, loeschenMonate: Number(x.target.value) })} />
            </Feld>
            <Feld label="Unbestätigte Anfragen löschen nach (Tagen)">
              <input className="a-input" type="number" min={1} value={e.doiTage} onChange={(x) => setE({ ...e, doiTage: Number(x.target.value) })} />
            </Feld>
            <Feld label="Kunden-Links gültig (Tage, 0 = unbegrenzt)">
              <input className="a-input" type="number" min={0} value={e.linkGueltigTage} onChange={(x) => setE({ ...e, linkGueltigTage: Number(x.target.value) })} />
            </Feld>
          </div>
          <button className="a-btn" onClick={() => speichern({ loeschenMonate: e.loeschenMonate, doiTage: e.doiTage, linkGueltigTage: e.linkGueltigTage })}>
            Speichern
          </button>
        </Abschnitt>

        <Abschnitt titel="Pflichtangaben & Vertrauen">
          <Feld label="Vermittlerregister-Nummer (Fußzeile)">
            <input className="a-input" value={e.registerNr} onChange={(x) => setE({ ...e, registerNr: x.target.value })} />
          </Feld>
          <Feld label="Impressum (Link, leer = eigene Seite)">
            <input className="a-input" value={e.impressumUrl} onChange={(x) => setE({ ...e, impressumUrl: x.target.value })} />
          </Feld>
          <Feld label="Datenschutzerklärung (Link)" hinweis="Zusätzlich verlinkt jede Seite „Datenschutz bei dieser Seite“ (Texte → Rechtliches) mit den App-spezifischen Punkten.">
            <input className="a-input" value={e.datenschutzUrl} onChange={(x) => setE({ ...e, datenschutzUrl: x.target.value })} />
          </Feld>
          <Feld label="Erstinformation § 15 VersVermV (Link, leer = eigene Seite)">
            <input className="a-input" value={e.erstinformationUrl} onChange={(x) => setE({ ...e, erstinformationUrl: x.target.value })} />
          </Feld>
          <Feld label="Link zu echten Bewertungen (optional)" hinweis="Nur echte, öffentlich verlinkbare Bewertungen (z. B. Google, ProvenExpert). Leer = nicht anzeigen.">
            <input className="a-input" value={e.bewertungenUrl} onChange={(x) => setE({ ...e, bewertungenUrl: x.target.value })} />
          </Feld>
          <Feld label="Benachrichtigung bei neuen Anfragen an (E-Mail)" hinweis="Die Mail enthält keine Namen, nur einen Link in den Admin.">
            <input className="a-input" type="email" value={e.adminMail} onChange={(x) => setE({ ...e, adminMail: x.target.value })} />
          </Feld>
          <button className="a-btn" onClick={() => speichern({ registerNr: e.registerNr, impressumUrl: e.impressumUrl, datenschutzUrl: e.datenschutzUrl, erstinformationUrl: e.erstinformationUrl, bewertungenUrl: e.bewertungenUrl, adminMail: e.adminMail })}>
            Speichern
          </button>
        </Abschnitt>

        <Abschnitt titel="CRM-Anbindung" hinweis="Bestätigte Freund-Anfragen gehen per Webhook (JSON, HMAC-signiert) an das CRM. Alternativ: REST-API mit API-Key (siehe README).">
          <Feld label="Webhook-Adresse">
            <input className="a-input" placeholder="https://crm.example/api/geschenk-webhook" value={e.webhookUrl} onChange={(x) => setE({ ...e, webhookUrl: x.target.value })} />
          </Feld>
          <p className="text-sm">Webhook-Geheimnis: {e.webhookSecret ? 'gesetzt' : 'nicht gesetzt'}</p>
          {geheim.webhookSecret && (
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-amber-50 p-2 text-xs">{geheim.webhookSecret}</code>
              <KopierKnopf text={geheim.webhookSecret} />
            </div>
          )}
          <p className="text-sm">API-Key: {e.apiKeyHash ? 'gesetzt' : 'nicht gesetzt'}</p>
          {geheim.apiKey && (
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-amber-50 p-2 text-xs">{geheim.apiKey}</code>
              <KopierKnopf text={geheim.apiKey} />
            </div>
          )}
          {(geheim.apiKey || geheim.webhookSecret) && <Meldung art="info" text="Wird nur jetzt angezeigt. Bitte sicher im CRM hinterlegen." />}
          <div className="flex flex-wrap gap-2">
            <button className="a-btn" onClick={() => speichern({ webhookUrl: e.webhookUrl })}>
              Adresse speichern
            </button>
            <button className="a-btn2" onClick={() => confirm('Neues Webhook-Geheimnis erzeugen? Das CRM braucht dann das neue.') && speichern({ webhookSecretNeu: true })}>
              Neues Webhook-Geheimnis
            </button>
            <button className="a-btn2" onClick={() => confirm('Neuen API-Key erzeugen? Der alte wird ungültig.') && speichern({ apiKeyNeu: true })}>
              Neuer API-Key
            </button>
          </div>
        </Abschnitt>

        <Abschnitt titel="Berater-Zugänge">
          <ul className="text-sm">
            {(berater.daten ?? []).map((b) => (
              <li key={b.id}>
                {b.name} · {b.email} · {b.totp_aktiv ? '2FA aktiv' : '2FA noch nicht eingerichtet'}
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="a-input" placeholder="Name" value={neuB.name} onChange={(x) => setNeuB({ ...neuB, name: x.target.value })} aria-label="Name" />
            <input className="a-input" placeholder="E-Mail" value={neuB.email} onChange={(x) => setNeuB({ ...neuB, email: x.target.value })} aria-label="E-Mail" />
            <input className="a-input" type="password" placeholder="Startpasswort (12+)" value={neuB.passwort} onChange={(x) => setNeuB({ ...neuB, passwort: x.target.value })} aria-label="Startpasswort" />
          </div>
          <button
            className="a-btn2"
            onClick={async () => {
              const r = await anfrage('/api/admin/berater', 'POST', neuB);
              zeige(r, 'Zugang angelegt. 2FA wird beim ersten Login eingerichtet.');
              if (!r.error) setNeuB({ name: '', email: '', passwort: '' });
              berater.laden();
            }}
          >
            Berater hinzufügen
          </button>
          <div className="border-t border-slate-100 pt-3">
            <p className="a-label">Eigenes Passwort ändern</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="a-input" type="password" placeholder="Aktuelles Passwort" autoComplete="current-password" value={pw.passwortAlt} onChange={(x) => setPw({ ...pw, passwortAlt: x.target.value })} aria-label="Aktuelles Passwort" />
              <input className="a-input" type="password" placeholder="Neues Passwort" autoComplete="new-password" value={pw.passwortNeu} onChange={(x) => setPw({ ...pw, passwortNeu: x.target.value })} aria-label="Neues Passwort" />
            </div>
            <button
              className="a-btn2 mt-2"
              onClick={async () => {
                zeige(await anfrage('/api/admin/profil', 'PUT', pw), 'Passwort geändert.');
                setPw({ passwortAlt: '', passwortNeu: '' });
              }}
            >
              Passwort ändern
            </button>
          </div>
        </Abschnitt>
      </div>
    </Shell>
  );
}
