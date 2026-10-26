// Beispieldaten zum Durchklicken: 2 Berater, 4 Geschenke, Nachrichtenvorlagen (A/B), 3 erfundene Beispiel-Kunden.
// Keine echten Kundendaten! Aufruf: npm run seed
import { ladeEnv } from './env.ts';
ladeEnv();

const { getDb, one, run, insertRow } = await import('../src/lib/db.ts');
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

const PKV_CHECKLISTE = `# 7 Fehler beim Wechsel in die PKV

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
Ein Wechsel zurück ist oft nur eingeschränkt möglich. Die Entscheidung sollte deshalb gut überlegt sein.`;

// ---------- Nachrichtenvorlagen (Empfehler → Freund) ----------
// Alte Standardtexte aus früheren Versionen werden ersetzt, selbst geänderte Texte bleiben.
const ALTE_VORLAGEN = [
  'Hey! Ich hab da jemanden, der mir echt weitergeholfen hat. Er schenkt dir: {geschenk}. Kostenlos, und niemand ruft dich danach an. Schau mal: {link}',
  'Kleiner Tipp von mir 🙂 {geschenk}, geschenkt von mir. Kein Haken, du entscheidest selbst, ob du dich meldest. {link}',
  'Geschenk von mir für dich 🎁 {geschenk}: {link}',
  'Hi! Ich bin seit einer Weile bei AVEYO und wirklich zufrieden: ehrlich, verständlich, ohne Druck. Ich darf dir etwas schenken: {geschenk}. Kostet nichts, verpflichtet zu nichts, und niemand ruft dich ungefragt an. Wenn es dich interessiert, schau hier: {link}',
  'Hey! Ich bin ja bei AVEYO und echt happy damit. Jetzt darf ich Freunden was schenken, und da musste ich direkt an dich denken: {geschenk_satz}. Kostet dich nichts, und keiner ruft dich an. Schau einfach mal rein, wenn du magst 🙂 {link}',
  'Hi! Ich lasse mich seit einer Weile von AVEYO beraten und bin wirklich zufrieden: ehrlich, verständlich und ohne Verkaufsdruck. Jetzt darf ich Freunden etwas schenken, und ich dachte sofort an dich: {geschenk_satz}. Das kostet dich nichts, verpflichtet zu nichts, und niemand ruft dich ungefragt an. Wenn es dich interessiert, schau hier: {link}',
];
const VORLAGEN: [string, string, string][] = [
  ['locker', 'A', 'Hey! Ich bin ja bei AVEYO und echt happy damit. Jetzt darf ich Freunden was schenken, und da musste ich direkt an dich denken: {geschenk_satz}. Für dich ist es geschenkt, und keiner ruft dich an. Schau einfach mal rein, wenn du magst 🙂 {link}'],
  ['locker', 'B', 'Kleiner Tipp unter uns: Ich hab hier {geschenk_satz} für dich 🎁 Ganz ohne Haken, du entscheidest selbst, ob du dich meldest. {link}'],
  ['kurz', 'A', 'Ich schenk dir {geschenk_satz} 🎁 {link}'],
  [
    'ausfuehrlich',
    'A',
    'Hi! Ich lasse mich seit einer Weile von AVEYO beraten und bin wirklich zufrieden: ehrlich, verständlich und ohne Verkaufsdruck. Jetzt darf ich Freunden etwas schenken, und ich dachte sofort an dich: {geschenk_satz}. Das ist für dich geschenkt, verpflichtet zu nichts, und niemand ruft dich ungefragt an. Wenn es dich interessiert, schau hier: {link}',
  ],
];
for (const alt of ALTE_VORLAGEN) {
  const v = one<{ id: number; ton: string; variante: string }>('SELECT id, ton, variante FROM vorlagen WHERE text = ?', alt);
  const neu = v && VORLAGEN.find(([ton, variante]) => ton === v.ton && variante === v.variante);
  if (v && neu) run('UPDATE vorlagen SET text = ? WHERE id = ?', neu[2], v.id);
}
for (const [ton, variante, text] of VORLAGEN)
  if (!one('SELECT 1 FROM vorlagen WHERE ton = ? AND variante = ?', ton, variante)) insertRow('vorlagen', { ton, variante, text });

// ---------- Geschenke (nach Titel ergänzt; vorhandene bekommen nur fehlende Satzform) ----------
type G = Record<string, string | number>;
const GESCHENKE: G[] = [
  {
    titel: 'Versicherungs-Check-up',
    anlaesse: 'gerade umgezogen ist oder mit jemandem zusammenzieht\nein Kind bekommen hat oder heiratet\nsich selbstständig gemacht oder den Job gewechselt hat\nseit Jahren nicht mehr auf seine Versicherungen geschaut hat',
    akkusativ: 'einen persönlichen Versicherungs-Check-up',
    kurz: 'Ist das Wichtige abgesichert und zahlst du für Unnötiges? Einmal in Ruhe draufschauen.',
    nutzen: 'Überblick, welche Versicherungen du hast und welche wichtigen fehlen\nHinweise auf doppelte oder überflüssige Verträge\nEine ehrliche Einschätzung, auch wenn alles passt',
    ablauf: 'Termin aussuchen (online oder in Hamburg)\nVerträge grob zusammensuchen, es muss nicht vollständig sein\n30 Minuten Gespräch, danach entscheidest du',
    dauer: '30 Minuten',
    typ: 'termin',
    wert: 299,
    themen: '',
    icon: '🛡️',
    reihenfolge: 1,
  },
  {
    titel: 'Checkliste: Die wichtigsten Versicherungen',
    anlaesse: 'zum ersten Mal eine eigene Wohnung hat\ngerade mit Studium oder Ausbildung fertig ist\nsich fragt, ob er zu viel oder zu wenig versichert ist',
    akkusativ: 'eine Checkliste mit den wichtigsten Versicherungen',
    kurz: 'In fünf Minuten selbst prüfen, ob das Wichtigste abgesichert ist. Sofort, ohne Termin.',
    nutzen: 'Die wichtigsten Absicherungen auf einen Blick\nZum Abhaken, Ausdrucken oder als PDF speichern\nKeine Anmeldung nötig',
    ablauf: 'Auf „Jetzt ansehen“ tippen\nPunkt für Punkt abhaken\nFertig, ganz ohne Gespräch',
    dauer: '5 Minuten',
    typ: 'download',
    themen: '',
    icon: '📋',
    reihenfolge: 2,
    inhalt: `# Die wichtigsten Versicherungen – hast du sie?

[Beispielinhalt – vor Veröffentlichung fachlich und rechtlich prüfen]

Diese Checkliste dient der Information und ersetzt keine individuelle Beratung. Was sinnvoll ist, hängt von deiner Lebenssituation ab.

## Für fast alle wichtig
- ☐ Private Haftpflichtversicherung: schützt dich, wenn du anderen einen Schaden zufügst
- ☐ Krankenversicherung (gesetzlich oder privat): in Deutschland Pflicht
- ☐ Absicherung der Arbeitskraft (z. B. Berufsunfähigkeitsversicherung): wenn du von deinem Einkommen lebst

## Je nach Lebenslage
- ☐ Risikolebensversicherung: wenn Familie oder ein Kredit von deinem Einkommen abhängt
- ☐ Wohngebäudeversicherung: wenn du ein Haus besitzt
- ☐ Kfz-Haftpflicht: Pflicht, sobald du ein Auto hast
- ☐ Hausratversicherung: wenn dein Hausrat einen größeren Wert hat
- ☐ Krankentagegeld: vor allem für Selbstständige und privat Versicherte

## Für später im Blick behalten
- ☐ Altersvorsorge: Wie groß ist deine Rentenlücke?
- ☐ Pflegevorsorge

## Gut zu wissen
Viele Verträge laufen doppelt oder passen nicht mehr zur aktuellen Lebenssituation. Ein Blick alle paar Jahre lohnt sich.`,
  },
  {
    titel: 'PKV-Beitragscheck',
    anlaesse: 'privat versichert ist und über steigende Beiträge stöhnt\nseit vielen Jahren im selben PKV-Tarif ist',
    akkusativ: 'einen persönlichen PKV-Beitragscheck',
    kurz: 'Zahlst du zu viel? Wir schauen gemeinsam auf deinen Tarif.',
    nutzen: 'Klarheit, ob dein Beitrag zu deinen Leistungen passt\nHinweise auf Tarifwechsel innerhalb deiner Gesellschaft (§ 204 VVG)\nEine ehrliche Einschätzung, auch wenn alles passt',
    ablauf: 'Termin aussuchen (online oder in Hamburg)\nTarifunterlagen bereitlegen\n30 Minuten Gespräch, danach entscheidest du',
    dauer: '30 Minuten',
    typ: 'termin',
    wert: 299,
    themen: 'pkv',
    icon: '🩺',
    reihenfolge: 3,
  },
  {
    titel: 'Zweitmeinung zu deiner Altersvorsorge',
    anlaesse: 'einen Renten- oder Riestervertrag hat und nicht weiß, ob er passt\nsich vorgenommen hat, sich endlich um die Rente zu kümmern\njetzt deutlich mehr verdient als früher',
    akkusativ: 'eine persönliche Zweitmeinung zu deiner Altersvorsorge',
    kurz: '30 Minuten, unverbindlich. Passt deine Vorsorge zu deinen Plänen?',
    nutzen: 'Ein unabhängiger Blick auf deine bestehenden Verträge\nVerständlich erklärt, ohne Fachchinesisch\nKein Verkaufsgespräch',
    ablauf: 'Termin aussuchen\nUnterlagen mitbringen, die du schon hast\nGespräch, danach hast du eine Einschätzung',
    dauer: '30 Minuten',
    typ: 'termin',
    wert: 299,
    themen: 'vorsorge,vermoegen',
    icon: '🧭',
    reihenfolge: 4,
  },
  {
    titel: 'Ist dein Einkommen abgesichert?',
    anlaesse: 'selbstständig ist und von seiner Arbeitskraft lebt\nAlleinverdiener in der Familie ist\neinen Kredit abbezahlt',
    akkusativ: 'einen persönlichen Check, ob dein Einkommen abgesichert ist',
    kurz: 'Was passiert, wenn du länger nicht arbeiten kannst? Klarheit in 30 Minuten.',
    nutzen: 'Überblick, was im Krankheitsfall wirklich an Geld reinkommt\nVerständlich erklärt für Angestellte und Selbstständige\nEine ehrliche Einschätzung, ohne Verkaufsdruck',
    ablauf: 'Termin aussuchen\nGehaltsabrechnung oder Einkommen grob parat haben\n30 Minuten Gespräch, danach entscheidest du',
    dauer: '30 Minuten',
    typ: 'termin',
    wert: 299,
    themen: 'vorsorge',
    icon: '💪',
    reihenfolge: 5,
  },
  {
    titel: 'Rentenlücken-Rechner',
    anlaesse: 'an die Rente noch gar nicht denkt\nerst mal selbst wissen möchte, wo er steht, ganz ohne Gespräch',
    akkusativ: 'einen Rentenlücken-Rechner',
    kurz: 'In zwei Minuten sehen, wie groß deine Lücke im Alter sein könnte.',
    nutzen: 'Sofort ein Ergebnis, ohne Anmeldung\nAlle Annahmen offen sichtbar\nPersönliche Auswertung nur, wenn du willst',
    ablauf: 'Ein paar Zahlen eintragen\nErgebnis ansehen\nOptional: Auswertung per Mail anfragen',
    dauer: '2 Minuten',
    typ: 'rechner',
    rechner: 'rentenluecke',
    themen: 'vorsorge,vermoegen',
    icon: '🧮',
    reihenfolge: 6,
  },
  {
    titel: 'Erstgespräch Kapitalanlage-Immobilie',
    anlaesse: 'überlegt, eine Wohnung als Geldanlage zu kaufen\nsich fragt, ob eine Immobilie als Geldanlage zu ihm passt',
    akkusativ: 'ein persönliches Erstgespräch zur Immobilie als Kapitalanlage',
    kurz: 'Wie funktioniert eine vermietete Wohnung als Geldanlage? Verständlich erklärt.',
    nutzen: 'Die Grundlagen verständlich erklärt\nWelche Rolle Eigenkapital, Einkommen und Steuern spielen\nOhne Verpflichtung, ohne Druck',
    ablauf: 'Termin aussuchen (online oder in Hamburg)\nFragen mitbringen, Unterlagen sind nicht nötig\n45 Minuten Gespräch, danach entscheidest du',
    dauer: '45 Minuten',
    typ: 'termin',
    wert: 299,
    themen: 'immobilien,vermoegen',
    icon: '🏠',
    reihenfolge: 7,
  },
  {
    titel: 'Checkliste: 7 Fehler beim Wechsel in die PKV',
    anlaesse: 'überlegt, in die private Krankenversicherung zu wechseln\ngerade selbstständig geworden ist',
    akkusativ: 'eine Checkliste mit 7 Fehlern beim Wechsel in die PKV',
    kurz: 'Sofort zum Download, ganz ohne Termin.',
    nutzen: 'Die typischen Stolperfallen auf einen Blick\nZum Ausdrucken oder als PDF speichern\nKeine Anmeldung nötig',
    ablauf: 'Auf „Jetzt ansehen“ tippen\nLesen oder speichern\nFertig',
    dauer: '5 Minuten Lesezeit',
    typ: 'download',
    themen: 'pkv',
    icon: '✅',
    reihenfolge: 8,
    inhalt: PKV_CHECKLISTE,
  },
];
// Frühere Titel/Satzformen mit „kostenlos“ umbenennen (nur unveränderte Standardwerte)
const UMBENENNEN: [string, string, string, string][] = [
  ['Kostenloser Versicherungs-Check-up', 'Versicherungs-Check-up', 'einen kostenlosen Versicherungs-Check-up', 'einen persönlichen Versicherungs-Check-up'],
  ['Kostenloser PKV-Beitragscheck', 'PKV-Beitragscheck', 'einen kostenlosen PKV-Beitragscheck', 'einen persönlichen PKV-Beitragscheck'],
  ['Zweitmeinung zu deiner Altersvorsorge', 'Zweitmeinung zu deiner Altersvorsorge', 'eine kostenlose Zweitmeinung zu deiner Altersvorsorge', 'eine persönliche Zweitmeinung zu deiner Altersvorsorge'],
  ['Ist dein Einkommen abgesichert?', 'Ist dein Einkommen abgesichert?', 'einen kostenlosen Check, ob dein Einkommen abgesichert ist', 'einen persönlichen Check, ob dein Einkommen abgesichert ist'],
  ['Erstgespräch Kapitalanlage-Immobilie', 'Erstgespräch Kapitalanlage-Immobilie', 'ein kostenloses Erstgespräch zur Immobilie als Kapitalanlage', 'ein persönliches Erstgespräch zur Immobilie als Kapitalanlage'],
];
for (const [altT, neuT, altS, neuS] of UMBENENNEN) {
  run('UPDATE geschenke SET titel = ? WHERE titel = ?', neuT, altT);
  run('UPDATE geschenke SET akkusativ = ? WHERE titel = ? AND akkusativ = ?', neuS, neuT, altS);
  run("UPDATE geschenke SET wert = 299 WHERE titel = ? AND typ = 'termin' AND wert IS NULL", neuT);
}

for (const g of GESCHENKE) {
  const da = one<{ id: number; akkusativ: string | null; anlaesse: string | null }>('SELECT id, akkusativ, anlaesse FROM geschenke WHERE titel = ?', g.titel);
  if (!da) insertRow('geschenke', g);
  else {
    if (!da.akkusativ) run('UPDATE geschenke SET akkusativ = ?, reihenfolge = ? WHERE id = ?', g.akkusativ, g.reihenfolge, da.id);
    if (!da.anlaesse) run('UPDATE geschenke SET anlaesse = ? WHERE id = ?', g.anlaesse, da.id);
  }
}

// ---------- Anlässe: „Wem möchtest du etwas schenken? Jemandem, der …“ ----------
if (!one('SELECT 1 FROM anlaesse LIMIT 1')) {
  const id = (titel: string) => one<{ id: number }>('SELECT id FROM geschenke WHERE titel = ?', titel)?.id;
  const ANLAESSE: [string, string, string[], string][] = [
    ['🩺', 'über seine PKV-Beiträge stöhnt', ['PKV-Beitragscheck', 'Checkliste: 7 Fehler beim Wechsel in die PKV'], 'pkv'],
    ['🏢', 'über eine Wohnung als Geldanlage nachdenkt', ['Erstgespräch Kapitalanlage-Immobilie'], 'immobilien,vermoegen'],
    ['🏠', 'gerade umgezogen ist oder mit jemandem zusammenzieht', ['Versicherungs-Check-up', 'Checkliste: Die wichtigsten Versicherungen'], ''],
    ['👶', 'ein Kind bekommen hat oder heiratet', ['Versicherungs-Check-up', 'Ist dein Einkommen abgesichert?'], ''],
    ['💼', 'sich selbstständig gemacht hat', ['Ist dein Einkommen abgesichert?', 'Versicherungs-Check-up', 'Checkliste: 7 Fehler beim Wechsel in die PKV'], ''],
    ['🧓', 'endlich an die Rente denken will', ['Zweitmeinung zu deiner Altersvorsorge', 'Rentenlücken-Rechner'], ''],
    ['🎓', 'gerade ins Berufsleben startet', ['Checkliste: Die wichtigsten Versicherungen', 'Rentenlücken-Rechner'], ''],
    ['🤔', 'lange nicht auf seine Versicherungen geschaut hat', ['Versicherungs-Check-up', 'Checkliste: Die wichtigsten Versicherungen'], ''],
  ];
  ANLAESSE.forEach(([icon, text, titel, themen], i) => {
    const geschenke = titel.map(id).filter(Boolean).join(',');
    if (geschenke) insertRow('anlaesse', { icon, text, geschenke, themen, reihenfolge: i + 1 });
  });
}

if (!one('SELECT 1 FROM kunden LIMIT 1')) {
  kundeAnlegen({ vorname: 'Lisa', nachname: 'Beispiel', email: 'lisa@example.org', handy: '+49 170 0000001', themen: 'pkv,vorsorge', berater_id: adrian, extern_id: 'DEMO-1' });
  kundeAnlegen({ anrede: 'herr', ansprache: 'sie', vorname: 'Jonas', nachname: 'Muster', email: 'jonas@example.org', themen: 'vorsorge,vermoegen', berater_id: adrian, extern_id: 'DEMO-2' });
  kundeAnlegen({ vorname: 'Mia', nachname: 'Test', email: 'mia@example.org', themen: 'immobilien', berater_id: adrian, extern_id: 'DEMO-3' });
}

// Ältere Test-Datenbanken: Jonas zeigt die Sie-Form
run("UPDATE kunden SET anrede = 'herr', ansprache = 'sie' WHERE extern_id = 'DEMO-2' AND anrede = '' AND ansprache = ''");
// A/B-Test Dankeschön: Lisa und Mia in Gruppe A (Spende), Jonas in Gruppe B (Gutschein)
run("UPDATE kunden SET belohnung_variante = 'A' WHERE extern_id IN ('DEMO-1', 'DEMO-3') AND belohnung_variante = ''");
run("UPDATE kunden SET belohnung_variante = 'B' WHERE extern_id = 'DEMO-2' AND belohnung_variante = ''");
// Lisa zeigt den persönlichen Erfolgs-Satz (erfundenes Beispiel)
run("UPDATE kunden SET zitat_vorschlag = 'Ich spare jetzt 840 € im Jahr' WHERE extern_id = 'DEMO-1' AND zitat_vorschlag IS NULL");

console.log('\nBeispieldaten bereit.\n');
console.log(`Admin:   ${process.env.GESCHENK_BASE_URL || 'http://localhost:3200'}/admin`);
console.log(`         adrian@example.org / ${DEMO_PASSWORT}  (oder timo@example.org)`);
console.log('\nPersönliche Kunden-Links (Magic-Links):');
for (const k of (await import('../src/lib/db.ts')).all<{ id: number; vorname: string; nachname: string }>('SELECT id, vorname, nachname FROM kunden ORDER BY id'))
  console.log(`  ${`${k.vorname} ${k.nachname}`.padEnd(16)} ${linkFuer(k.id) ?? '(kein gültiger Link)'}`);
console.log('');
