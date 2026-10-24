// Beispieldaten zum Durchklicken: 2 Berater, 4 Geschenke, Nachrichtenvorlagen (A/B), 3 erfundene Beispiel-Kunden.
// Keine echten Kundendaten! Aufruf: npm run seed
import { ladeEnv } from './env.ts';
ladeEnv();

const { getDb, one, insertRow } = await import('../src/lib/db.ts');
const { hashPasswort } = await import('../src/lib/token.ts');
const { kundeAnlegen, linkFuer } = await import('../src/lib/kunden.ts');

getDb();
const DEMO_PASSWORT = 'geschenk-demo-2026';

function berater(name: string, email: string, vorstellung: string) {
  const b = one<{ id: number }>('SELECT id FROM berater WHERE email = ?', email);
  if (b) return b.id;
  return insertRow('berater', { name, email, pw_hash: hashPasswort(DEMO_PASSWORT), vorstellung });
}

const adrian = berater(
  'Adrian',
  'adrian@example.org',
  'Ich bin Mitgründer von AVEYO in Hamburg und unabhängiger Versicherungsmakler. Mein Schwerpunkt: private Krankenversicherung und Altersvorsorge für Selbstständige und Angestellte. [Beispieltext – bitte im Admin anpassen]',
);
berater('Timo', 'timo@example.org', '[Beispieltext – bitte im Admin anpassen]');

if (!one('SELECT 1 FROM vorlagen LIMIT 1')) {
  const v = (ton: string, variante: string, text: string) => insertRow('vorlagen', { ton, variante, text });
  v('locker', 'A', 'Hey! Ich hab da jemanden, der mir echt weitergeholfen hat. Er schenkt dir: {geschenk}. Kostenlos, und niemand ruft dich danach an. Schau mal: {link}');
  v('locker', 'B', 'Kleiner Tipp von mir 🙂 {geschenk}, geschenkt von mir. Kein Haken, du entscheidest selbst, ob du dich meldest. {link}');
  v('kurz', 'A', 'Geschenk von mir für dich 🎁 {geschenk}: {link}');
  v(
    'ausfuehrlich',
    'A',
    'Hi! Ich bin seit einer Weile bei AVEYO und wirklich zufrieden: ehrlich, verständlich, ohne Druck. Ich darf dir etwas schenken: {geschenk}. Kostet nichts, verpflichtet zu nichts, und niemand ruft dich ungefragt an. Wenn es dich interessiert, schau hier: {link}',
  );
}

if (!one('SELECT 1 FROM geschenke LIMIT 1')) {
  insertRow('geschenke', {
    titel: 'Kostenloser PKV-Beitragscheck',
    kurz: 'Zahlst du zu viel? Wir schauen gemeinsam auf deinen Tarif.',
    nutzen: 'Klarheit, ob dein Beitrag zu deinen Leistungen passt\nHinweise auf Tarifwechsel innerhalb deiner Gesellschaft (§ 204 VVG)\nEine ehrliche Einschätzung, auch wenn alles passt',
    ablauf: 'Termin aussuchen (online oder in Hamburg)\nTarifunterlagen bereitlegen\n30 Minuten Gespräch, danach entscheidest du',
    dauer: '30 Minuten',
    typ: 'termin',
    themen: 'pkv',
    icon: '🩺',
    reihenfolge: 1,
  });
  insertRow('geschenke', {
    titel: 'Zweitmeinung zu deiner Altersvorsorge',
    kurz: '30 Minuten, unverbindlich. Passt deine Vorsorge zu deinen Plänen?',
    nutzen: 'Ein unabhängiger Blick auf deine bestehenden Verträge\nVerständlich erklärt, ohne Fachchinesisch\nKein Verkaufsgespräch',
    ablauf: 'Termin aussuchen\nUnterlagen mitbringen, die du schon hast\nGespräch, danach hast du eine Einschätzung',
    dauer: '30 Minuten',
    typ: 'termin',
    themen: 'vorsorge,vermoegen',
    icon: '🧭',
    reihenfolge: 2,
  });
  insertRow('geschenke', {
    titel: 'Rentenlücken-Rechner',
    kurz: 'In zwei Minuten sehen, wie groß deine Lücke im Alter sein könnte.',
    nutzen: 'Sofort ein Ergebnis, ohne Anmeldung\nAlle Annahmen offen sichtbar\nPersönliche Auswertung nur, wenn du willst',
    ablauf: 'Ein paar Zahlen eintragen\nErgebnis ansehen\nOptional: Auswertung per Mail anfragen',
    dauer: '2 Minuten',
    typ: 'rechner',
    rechner: 'rentenluecke',
    themen: 'vorsorge,vermoegen',
    icon: '🧮',
    reihenfolge: 3,
  });
  insertRow('geschenke', {
    titel: 'Checkliste: 7 Fehler beim Wechsel in die PKV',
    kurz: 'Sofort zum Download, ganz ohne Termin.',
    nutzen: 'Die typischen Stolperfallen auf einen Blick\nZum Ausdrucken oder als PDF speichern\nKeine Anmeldung nötig',
    ablauf: 'Auf „Jetzt ansehen“ tippen\nLesen oder speichern\nFertig',
    dauer: '5 Minuten Lesezeit',
    typ: 'download',
    themen: 'pkv',
    icon: '✅',
    reihenfolge: 4,
    inhalt: `# 7 Fehler beim Wechsel in die PKV

[Beispielinhalt – vor Veröffentlichung fachlich und rechtlich prüfen]

Diese Checkliste dient der Information und ersetzt keine individuelle Beratung.

## 1. Nur auf den Einstiegsbeitrag schauen
Der Beitrag heute sagt wenig über den Beitrag in 20 Jahren. Wichtig sind auch die Leistungen und wie der Tarif kalkuliert ist.

## 2. Gesundheitsfragen ungenau beantworten
Die Fragen im Antrag müssen vollständig und wahrheitsgemäß beantwortet werden. Fehler können später den Versicherungsschutz gefährden.

## 3. Leistungen nicht mit dem eigenen Bedarf abgleichen
- Psychotherapie
- Hilfsmittel
- Zahnersatz und Kieferorthopädie
- Ambulante und stationäre Leistungen

## 4. Die Selbstbeteiligung falsch wählen
Eine hohe Selbstbeteiligung senkt den Beitrag, muss aber im Ernstfall auch bezahlt werden können.

## 5. Die Familienplanung vergessen
In der PKV wird jede Person einzeln versichert. Kinder kosten eigene Beiträge.

## 6. Die Einkommensabsicherung vergessen
Gerade Selbstständige sollten prüfen, wie ihr Einkommen bei längerer Krankheit abgesichert ist (z. B. Krankentagegeld).

## 7. Den Rückweg in die gesetzliche Kasse unterschätzen
Ein Wechsel zurück ist oft nur eingeschränkt möglich. Die Entscheidung sollte deshalb gut überlegt sein.`,
  });
}

if (!one('SELECT 1 FROM kunden LIMIT 1')) {
  kundeAnlegen({ vorname: 'Lisa', nachname: 'Beispiel', email: 'lisa@example.org', handy: '+49 170 0000001', themen: 'pkv,vorsorge', berater_id: adrian, extern_id: 'DEMO-1' });
  kundeAnlegen({ vorname: 'Jonas', nachname: 'Muster', email: 'jonas@example.org', themen: 'vorsorge,vermoegen', berater_id: adrian, extern_id: 'DEMO-2' });
  kundeAnlegen({ vorname: 'Mia', nachname: 'Test', email: 'mia@example.org', themen: 'immobilien', berater_id: adrian, extern_id: 'DEMO-3' });
}

console.log('\nBeispieldaten bereit.\n');
console.log(`Admin:   ${process.env.GESCHENK_BASE_URL || 'http://localhost:3200'}/admin`);
console.log(`         adrian@example.org / ${DEMO_PASSWORT}  (oder timo@example.org)`);
console.log('\nPersönliche Kunden-Links (Magic-Links):');
for (const k of (await import('../src/lib/db.ts')).all<{ id: number; vorname: string; nachname: string }>('SELECT id, vorname, nachname FROM kunden ORDER BY id'))
  console.log(`  ${`${k.vorname} ${k.nachname}`.padEnd(16)} ${linkFuer(k.id) ?? '(kein gültiger Link)'}`);
console.log('');
