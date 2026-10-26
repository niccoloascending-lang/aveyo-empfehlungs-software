// Zentrale Textverwaltung. Jeder Text, den Kunden oder Freunde sehen (Seiten, Mails, Nachrichten), steht hier
// als Standard und kann im Admin unter „Texte“ überschrieben werden (Tabelle `texte`). Rein → testbar.
//
// Platzhalter in geschweiften Klammern, z. B. {vorname}. Unbekannte Platzhalter werden leer ersetzt.
// `sie` ist die Sie-Form; fehlt sie, gilt die Du-Form auch für „Sie“ (z. B. bei neutralen Texten).
// `rechtlich: true` markiert Texte, die vor dem Livegang juristisch geprüft werden sollen (Liste im README).

export type Anrede = 'du' | 'sie';

export type TextDef = {
  bereich: string;
  beschreibung: string;
  du: string;
  sie?: string;
  rechtlich?: boolean;
  lang?: boolean; // im Admin als großes Textfeld
};

export const TEXTE = {
  // ---------- Empfehler: Mein Geschenke-Bereich ----------
  'kunde.titel': { bereich: 'Empfehler', beschreibung: 'Überschrift ({anrede_name} = „Herr Muster“ bzw. Vor- und Nachname)', du: 'Hallo {vorname}!', sie: 'Hallo {anrede_name}!' },
  'kunde.begruessung': {
    bereich: 'Empfehler',
    beschreibung: 'Persönliche Begrüßung vom Berater',
    du: 'Schön, dass du mit uns zufrieden bist. Hier kannst du Freunden etwas schenken, das ihnen wirklich etwas bringt. Ganz ohne Verkaufsgespräch.',
    sie: 'Schön, dass Sie mit uns zufrieden sind. Hier können Sie Freunden etwas schenken, das ihnen wirklich etwas bringt. Ganz ohne Verkaufsgespräch.',
    lang: true,
  },
  'kunde.schritt1': { bereich: 'Empfehler', beschreibung: 'Schritt 1 Überschrift', du: 'Wem möchtest du etwas schenken?', sie: 'Wem möchten Sie etwas schenken?' },
  'kunde.schritt1.hinweis': {
    bereich: 'Empfehler',
    beschreibung: 'Schritt 1 Hinweis',
    du: 'Denk an eine Person. Ein Tipp genügt, das passende Geschenk suchen wir aus.',
    sie: 'Denken Sie an eine Person. Ein Tipp genügt, das passende Geschenk suchen wir aus.',
  },
  'kunde.anlass.praefix': { bereich: 'Empfehler', beschreibung: 'Vor den Anlass-Kacheln', du: 'Jemandem, der …' },
  'kunde.anlass.selbst': { bereich: 'Empfehler', beschreibung: 'Kachel: Geschenk selbst wählen', du: 'Ich weiß schon, was ich verschenken will', sie: 'Ich weiß schon, was ich verschenken möchte' },
  'kunde.anlass.passt': { bereich: 'Empfehler', beschreibung: 'Über dem vorgeschlagenen Geschenk', du: 'Das passt:' },
  'kunde.anlass.andere': { bereich: 'Empfehler', beschreibung: 'Vor den alternativen Geschenken', du: 'Oder lieber:' },
  'kunde.schritt2': { bereich: 'Empfehler', beschreibung: 'Schritt 2 Überschrift', du: 'Ein Satz von dir?', sie: 'Ein Satz von Ihnen?' },
  'kunde.schritt2.hinweis': {
    bereich: 'Empfehler',
    beschreibung: 'Schritt 2 Hinweis',
    du: 'Freiwillig. Erscheint mit deinem Vornamen auf der Seite deines Freundes.',
    sie: 'Freiwillig. Erscheint mit Ihrem Vornamen auf der Seite Ihres Freundes.',
  },
  'kunde.zitat.vorschlaege': {
    bereich: 'Empfehler',
    beschreibung: 'Satz-Vorschläge zum Antippen (mit | trennen)',
    du: 'Hat mir bei der PKV echt geholfen|Ehrlich und ohne Druck|Endlich hab ich meine Rente verstanden',
  },
  'kunde.zitat.platzhalter': { bereich: 'Empfehler', beschreibung: 'Platzhalter im Satz-Feld', du: 'In deinen Worten …', sie: 'In Ihren Worten …' },
  'kunde.schritt3': { bereich: 'Empfehler', beschreibung: 'Schritt 3 Überschrift', du: 'Verschenken', sie: 'Verschenken' },
  'kunde.ton': { bereich: 'Empfehler', beschreibung: 'Überschrift Nachrichtenton', du: 'Wie soll die Nachricht klingen?', sie: 'Wie soll die Nachricht klingen?' },
  'kunde.ton.locker': { bereich: 'Empfehler', beschreibung: 'Ton „locker“', du: 'Locker' },
  'kunde.ton.kurz': { bereich: 'Empfehler', beschreibung: 'Ton „kurz“', du: 'Kurz' },
  'kunde.ton.ausfuehrlich': { bereich: 'Empfehler', beschreibung: 'Ton „ausführlich“', du: 'Ausführlich' },
  'kunde.nachricht.hinweis': {
    bereich: 'Empfehler',
    beschreibung: 'Hinweis unter dem Nachrichtentext',
    du: 'Du kannst den Text noch ändern. Verschickt wird er von deinem Handy, nicht von uns.',
    sie: 'Sie können den Text noch ändern. Verschickt wird er von Ihrem Handy, nicht von uns.',
  },
  'kunde.vorschau.button': { bereich: 'Empfehler', beschreibung: 'Button Vorschau', du: 'So sieht es dein Freund', sie: 'So sieht es Ihr Freund' },
  'kunde.vorschau.schliessen': { bereich: 'Empfehler', beschreibung: 'Vorschau schließen', du: 'Schließen' },
  'kunde.video': { bereich: 'Empfehler', beschreibung: 'Link zum Begrüßungsvideo', du: 'Kurzes Video ansehen' },
  'kunde.vorschau.banner': {
    bereich: 'Empfehler',
    beschreibung: 'Banner über der Vorschau',
    du: 'Vorschau: Genau das sieht dein Freund. Nichts wird gespeichert oder verschickt.',
    sie: 'Vorschau: Genau das sieht Ihr Freund. Nichts wird gespeichert oder verschickt.',
  },
  'kunde.versprechen': {
    bereich: 'Empfehler',
    beschreibung: 'Versprechen an den Empfehler',
    du: 'Versprochen: Niemand ruft deinen Freund an. Er entscheidet selbst, ob er sich meldet.',
    sie: 'Versprochen: Niemand ruft Ihren Freund an. Er entscheidet selbst, ob er sich meldet.',
    rechtlich: true,
  },
  'kunde.teilen.kopieren': { bereich: 'Empfehler', beschreibung: 'Button Link kopieren', du: 'Text + Link kopieren' },
  'kunde.teilen.kopiert': { bereich: 'Empfehler', beschreibung: 'Rückmeldung nach Kopieren', du: 'Kopiert! Jetzt einfach einfügen.' },
  'kunde.teilen.mehr': { bereich: 'Empfehler', beschreibung: 'Button native Teilen-Funktion', du: 'Andere App …' },
  'kunde.teilen.erfolg': { bereich: 'Empfehler', beschreibung: 'Nach dem Teilen', du: 'Danke! Dein Geschenk ist unterwegs.', sie: 'Danke! Ihr Geschenk ist unterwegs.' },
  'kunde.qr.titel': { bereich: 'Empfehler', beschreibung: 'QR-Code Überschrift', du: 'Lieber persönlich zeigen?' },
  'kunde.qr.hinweis': { bereich: 'Empfehler', beschreibung: 'QR-Code Hinweis', du: '„Scan mal, da ist der Check.“' },
  'kunde.kontingent': {
    bereich: 'Empfehler',
    beschreibung: 'Kontingent: noch nichts verschenkt',
    du: 'Du hast {gesamt} Geschenke für Freunde zu vergeben.',
    sie: 'Sie haben {gesamt} Geschenke für Freunde zu vergeben.',
  },
  'kunde.kontingent.rest': { bereich: 'Empfehler', beschreibung: 'Kontingent: teilweise verschenkt', du: 'Noch {rest} von {gesamt} Geschenken übrig.' },
  'kunde.kontingent.letztes': { bereich: 'Empfehler', beschreibung: 'Kontingent: nur noch eins', du: 'Noch 1 Geschenk übrig. Wem schenkst du es?', sie: 'Noch 1 Geschenk übrig. Wem schenken Sie es?' },
  'kunde.kontingent.leer': {
    bereich: 'Empfehler',
    beschreibung: 'Kontingent aufgebraucht',
    du: 'Alle {gesamt} Geschenke sind verschenkt. Danke dir! Fällt dir noch jemand ein? Sag {berater} kurz Bescheid, dann gibt es neue.',
    sie: 'Alle {gesamt} Geschenke sind verschenkt. Vielen Dank! Fällt Ihnen noch jemand ein? Sagen Sie {berater} kurz Bescheid, dann gibt es neue.',
  },
  'kunde.zitat.erfolg': { bereich: 'Empfehler', beschreibung: 'Hinweis am persönlichen Satz-Vorschlag', du: 'Dein Erfolg', sie: 'Ihr Erfolg' },
  'kunde.sozial': {
    bereich: 'Empfehler',
    beschreibung: 'Soziale Bestätigung (Zahl = Startwert aus dem alten System + Kunden, die hier geteilt haben)',
    du: 'Schon {anzahl} Kunden haben ein Geschenk an Freunde weitergegeben.',
  },
  'kunde.baeume.titel': { bereich: 'Empfehler', beschreibung: 'Bäume: Überschrift', du: 'Dein Wäldchen', sie: 'Ihr Wäldchen' },
  'kunde.baeume.text': {
    bereich: 'Empfehler',
    beschreibung: 'Bäume: Erklärung',
    du: 'Für jedes Geschenk, das ein Freund einlöst, pflanzen wir einen Baum in Deutschland.',
    rechtlich: true,
  },
  'kunde.baeume.leer': { bereich: 'Empfehler', beschreibung: 'Bäume: noch keiner', du: 'Sobald ein Freund dein Geschenk einlöst, wächst hier dein erster Baum.', sie: 'Sobald ein Freund Ihr Geschenk einlöst, wächst hier Ihr erster Baum.' },
  'kunde.baeume.gesamt': { bereich: 'Empfehler', beschreibung: 'Bäume: alle Kunden zusammen', du: 'Gemeinsam mit allen Kunden: {anzahl} Bäume' },
  'kunde.wirkung.titel': { bereich: 'Empfehler', beschreibung: 'Bereich Wirkung', du: 'Meine Wirkung', sie: 'Meine Wirkung' },
  'kunde.wirkung.geoeffnet': { bereich: 'Empfehler', beschreibung: 'Zähler geöffnet', du: 'geöffnet' },
  'kunde.wirkung.eingeloest': { bereich: 'Empfehler', beschreibung: 'Zähler eingelöst', du: 'eingelöst' },
  'kunde.wirkung.geteilt': { bereich: 'Empfehler', beschreibung: 'Zähler verschenkt', du: 'verschenkt' },
  'kunde.wirkung.leer': {
    bereich: 'Empfehler',
    beschreibung: 'Noch keine Wirkung',
    du: 'Noch ist nichts passiert, und das ist völlig normal. Gute Tipps brauchen manchmal ein paar Tage.',
  },
  'kunde.wirkung.moment': { bereich: 'Empfehler', beschreibung: 'Freudenmoment nach neuer Einlösung', du: 'Dein Geschenk wurde gerade eingelöst 🎁', sie: 'Ihr Geschenk wurde gerade eingelöst 🎁' },
  'kunde.wirkung.namen': {
    bereich: 'Empfehler',
    beschreibung: 'Hinweis zu Namen',
    du: 'Namen siehst du nur, wenn deine Freunde das ausdrücklich erlaubt haben.',
    sie: 'Namen sehen Sie nur, wenn Ihre Freunde das ausdrücklich erlaubt haben.',
  },
  'kunde.wirkung.person': { bereich: 'Empfehler', beschreibung: 'Zeile für Freund mit Einwilligung', du: '{name} hat „{geschenk}“ genutzt' },
  'kunde.danke.titel': { bereich: 'Empfehler', beschreibung: 'Danke-Bereich Überschrift', du: 'Danke von uns' },
  'kunde.danke.text': {
    bereich: 'Empfehler',
    beschreibung: 'Danke-Bereich Text (erscheint erst nach der ersten Einlösung)',
    du: 'Du hast etwas Gutes weitergegeben. Dafür möchten wir uns bedanken, einfach so.',
    sie: 'Sie haben etwas Gutes weitergegeben. Dafür möchten wir uns bedanken, einfach so.',
    rechtlich: true,
  },
  'kunde.danke.spende.frage': {
    bereich: 'Empfehler',
    beschreibung: 'Frage zur Spende',
    du: 'Wohin dürfen wir in deinem Namen spenden?',
    sie: 'Wohin dürfen wir in Ihrem Namen spenden?',
  },
  'kunde.danke.spende.danke': { bereich: 'Empfehler', beschreibung: 'Nach Auswahl des Spendenzwecks', du: 'Danke! Wir kümmern uns darum.' },
  'kunde.link.ungueltig': {
    bereich: 'Empfehler',
    beschreibung: 'Ungültiger oder widerrufener Magic-Link',
    du: 'Dieser Link gilt nicht mehr. Melde dich gern kurz bei uns, dann bekommst du einen neuen.',
    sie: 'Dieser Link gilt nicht mehr. Melden Sie sich gern kurz bei uns, dann bekommen Sie einen neuen.',
  },
  'kunde.keine.geschenke': { bereich: 'Empfehler', beschreibung: 'Wenn keine Geschenke aktiv sind', du: 'Gerade sind keine Geschenke verfügbar. Schau bald wieder vorbei.' },

  // ---------- Freund: Landingpage ----------
  'freund.ueberschrift': { bereich: 'Freund', beschreibung: 'Satzanfang vor dem Geschenk („… einen persönlichen PKV-Beitragscheck“)', du: '{empfehler} schenkt dir', sie: '{empfehler} schenkt Ihnen' },
  'freund.ueberschrift.anonym': { bereich: 'Freund', beschreibung: 'Wenn kein Name bekannt ist', du: 'Ein Geschenk für dich', sie: 'Ein Geschenk für Sie' },
  'freund.kosten': { bereich: 'Freund', beschreibung: 'Hinweis bei Geschenken ohne Wert (Checkliste, Rechner)', du: 'Für dich geschenkt' },
  'freund.wert': { bereich: 'Freund', beschreibung: 'Hinweis bei Geschenken mit Wert (Gespräche)', du: 'Wert {wert} € · für dich geschenkt', rechtlich: true },
  'freund.wert.hinweis': {
    bereich: 'Freund',
    beschreibung: 'Erklärung zum Wert',
    du: 'So viel berechnen wir normalerweise für ein Beratungsgespräch, wenn daraus keine Zusammenarbeit entsteht. Für dich ist es geschenkt.',
    sie: 'So viel berechnen wir normalerweise für ein Beratungsgespräch, wenn daraus keine Zusammenarbeit entsteht. Für Sie ist es geschenkt.',
    rechtlich: true,
  },
  'freund.versprechen': {
    bereich: 'Freund',
    beschreibung: 'Das zentrale Versprechen (null Druck)',
    du: 'Kein Vertrag, kein Verkaufsdruck. Niemand ruft dich an. Du entscheidest.',
    sie: 'Kein Vertrag, kein Verkaufsdruck. Niemand ruft Sie an. Sie entscheiden.',
    rechtlich: true,
  },
  'freund.nutzen.titel': { bereich: 'Freund', beschreibung: 'Überschrift Nutzen', du: 'Was du bekommst', sie: 'Was Sie bekommen' },
  'freund.ablauf.titel': { bereich: 'Freund', beschreibung: 'Überschrift Ablauf', du: 'So läuft es ab' },
  'freund.dauer': { bereich: 'Freund', beschreibung: 'Label Dauer', du: 'Dauer' },
  'freund.berater.titel': { bereich: 'Freund', beschreibung: 'Überschrift Beratervorstellung', du: 'Wer dahintersteckt' },
  'freund.einloesen.titel': { bereich: 'Freund', beschreibung: 'Überschrift Einlösen', du: 'Geschenk einlösen' },
  'freund.termin.ort': { bereich: 'Freund', beschreibung: 'Frage nach dem Ort', du: 'Wo passt es dir?', sie: 'Wo passt es Ihnen?' },
  'freund.termin.ort.online': { bereich: 'Freund', beschreibung: 'Ort online', du: 'Online (Video)' },
  'freund.termin.ort.hamburg': { bereich: 'Freund', beschreibung: 'Ort vor Ort', du: 'Vor Ort in Hamburg' },
  'freund.termin.slot': { bereich: 'Freund', beschreibung: 'Frage nach dem Termin', du: 'Wann passt es dir?', sie: 'Wann passt es Ihnen?' },
  'freund.termin.keine.slots': {
    bereich: 'Freund',
    beschreibung: 'Keine freien Termine',
    du: 'Gerade sind keine Termine frei. Schau in ein paar Tagen wieder rein.',
    sie: 'Gerade sind keine Termine frei. Schauen Sie in ein paar Tagen wieder herein.',
  },
  'freund.termin.formular': {
    bereich: 'Freund',
    beschreibung: 'Hinweis über dem Formular',
    du: 'Damit wir dir den Termin bestätigen können. Deine Angaben nutzen wir nur dafür.',
    sie: 'Damit wir Ihnen den Termin bestätigen können. Ihre Angaben nutzen wir nur dafür.',
    rechtlich: true,
  },
  'freund.termin.button': { bereich: 'Freund', beschreibung: 'Button Termin anfragen', du: 'Termin anfragen' },
  'freund.termin.danke': {
    bereich: 'Freund',
    beschreibung: 'Nach der Terminanfrage',
    du: 'Fast geschafft! Wir haben dir eine E-Mail geschickt. Bitte bestätige den Termin dort mit einem Klick.',
    sie: 'Fast geschafft! Wir haben Ihnen eine E-Mail geschickt. Bitte bestätigen Sie den Termin dort mit einem Klick.',
  },
  'freund.termin.extern': { bereich: 'Freund', beschreibung: 'Button bei externem Buchungstool', du: 'Termin auswählen' },
  'freund.download.button': { bereich: 'Freund', beschreibung: 'Button Download', du: 'Jetzt ansehen & speichern' },
  'freund.download.mail.frage': {
    bereich: 'Freund',
    beschreibung: 'Optionale Zusendung per Mail',
    du: 'Willst du es zusätzlich per Mail?',
    sie: 'Möchten Sie es zusätzlich per Mail?',
  },
  'freund.download.mail.hinweis': {
    bereich: 'Freund',
    beschreibung: 'Erklärung Double-Opt-in Download',
    du: 'Du bekommst zuerst eine kurze Bestätigungs-Mail. Erst nach deinem Klick schicken wir dir den Link. Sonst nichts.',
    sie: 'Sie bekommen zuerst eine kurze Bestätigungs-Mail. Erst nach Ihrem Klick schicken wir Ihnen den Link. Sonst nichts.',
    rechtlich: true,
  },
  'freund.download.mail.danke': {
    bereich: 'Freund',
    beschreibung: 'Nach Mail-Wunsch',
    du: 'Danke! Schau in dein Postfach und bestätige kurz.',
    sie: 'Danke! Bitte schauen Sie in Ihr Postfach und bestätigen Sie kurz.',
  },
  'freund.rechner.ergebnis': { bereich: 'Freund', beschreibung: 'Überschrift Rechner-Ergebnis', du: 'Dein Ergebnis', sie: 'Ihr Ergebnis' },
  'freund.rechner.hinweis': {
    bereich: 'Freund',
    beschreibung: 'Hinweis unter dem Rechner',
    du: 'Vereinfachte Modellrechnung zur Orientierung. Keine Beratung und keine Prognose.',
    rechtlich: true,
  },
  'freund.rechner.auswertung.frage': {
    bereich: 'Freund',
    beschreibung: 'Optionale Auswertung',
    du: 'Möchtest du eine persönliche Auswertung? Nur wenn du willst.',
    sie: 'Möchten Sie eine persönliche Auswertung? Nur wenn Sie wollen.',
  },
  'freund.rechner.auswertung.danke': {
    bereich: 'Freund',
    beschreibung: 'Nach Auswertungs-Wunsch',
    du: 'Danke! Bitte bestätige kurz deine E-Mail-Adresse, dann melden wir uns per Mail.',
    sie: 'Danke! Bitte bestätigen Sie kurz Ihre E-Mail-Adresse, dann melden wir uns per Mail.',
  },
  'freund.einwilligung.empfehler': {
    bereich: 'Freund',
    beschreibung: 'Freiwillige Einwilligung (nicht vorausgewählt)',
    du: '{empfehler} darf erfahren, dass ich das Geschenk genutzt habe.',
    rechtlich: true,
  },
  'freund.einwilligung.datenschutz': {
    bereich: 'Freund',
    beschreibung: 'Pflicht-Hinweis bei Formularen',
    du: 'Ich habe die Datenschutzhinweise gelesen. Meine Angaben werden nur für diese Anfrage verwendet.',
    rechtlich: true,
  },
  'freund.weitergeben.titel': {
    bereich: 'Freund',
    beschreibung: 'Weitergeben (erst nach Einlösung)',
    du: 'Kennst du noch jemanden, für den das spannend ist?',
    sie: 'Kennen Sie noch jemanden, für den das spannend ist?',
  },
  'freund.weitergeben.name': { bereich: 'Freund', beschreibung: 'Feld Vorname beim Weitergeben', du: 'Dein Vorname (freiwillig)', sie: 'Ihr Vorname (freiwillig)' },
  'freund.weitergeben.button': { bereich: 'Freund', beschreibung: 'Button Weitergeben', du: 'Geschenk weitergeben' },
  'freund.weitergeben.nachricht': {
    bereich: 'Freund',
    beschreibung: 'Nachricht beim Weitergeben',
    du: 'Ich hab gerade {geschenk_satz} geschenkt bekommen und fand es richtig gut. Das kann ich weitergeben – vielleicht ist es auch was für dich? Ist geschenkt, und niemand ruft dich an. {link}',
  },
  'freund.form.senden': { bereich: 'Freund', beschreibung: 'Button Absenden', du: 'Absenden' },
  'freund.form.pflicht': { bereich: 'Freund', beschreibung: 'Fehler Pflichtfelder', du: 'Bitte Vorname, E-Mail und den Datenschutz-Hinweis ausfüllen.' },
  'freund.download.mail.button': { bereich: 'Freund', beschreibung: 'Button Download per Mail', du: 'Per Mail schicken' },
  'freund.eingeloest': { bereich: 'Freund', beschreibung: 'Kurze Freude nach dem Einlösen', du: 'Viel Freude damit!' },
  'freund.vorschau.inaktiv': { bereich: 'Freund', beschreibung: 'Hinweis in der Vorschau', du: 'In der Vorschau ist das Einlösen ausgeschaltet.' },
  'freund.rechner.alter': { bereich: 'Freund', beschreibung: 'Rechner: Alter', du: 'Dein Alter', sie: 'Ihr Alter' },
  'freund.rechner.rentenalter': { bereich: 'Freund', beschreibung: 'Rechner: Rentenbeginn', du: 'Rentenbeginn mit' },
  'freund.rechner.netto': { bereich: 'Freund', beschreibung: 'Rechner: Netto', du: 'Dein Netto pro Monat (€)', sie: 'Ihr Netto pro Monat (€)' },
  'freund.rechner.rente': {
    bereich: 'Freund',
    beschreibung: 'Rechner: erwartete Rente',
    du: 'Erwartete Rente pro Monat (€), z. B. aus deiner Renteninformation',
    sie: 'Erwartete Rente pro Monat (€), z. B. aus Ihrer Renteninformation',
  },
  'freund.rechner.ziel': { bereich: 'Freund', beschreibung: 'Rechner: Zielniveau', du: 'Bedarf im Alter (% vom Netto)' },
  'freund.rechner.inflation': { bereich: 'Freund', beschreibung: 'Rechner: Inflation', du: 'Inflation pro Jahr (%)' },
  'freund.rechner.button': { bereich: 'Freund', beschreibung: 'Rechner: Button', du: 'Ausrechnen' },
  'freund.rechner.luecke': { bereich: 'Freund', beschreibung: 'Rechner: Lücke heute', du: 'Monatliche Lücke in heutiger Kaufkraft' },
  'freund.rechner.luecke.spaeter': { bereich: 'Freund', beschreibung: 'Rechner: Lücke bei Rentenbeginn', du: 'Das entspricht bei Rentenbeginn etwa' },
  'freund.rechner.annahmen': { bereich: 'Freund', beschreibung: 'Rechner: Überschrift Annahmen', du: 'Annahmen' },
  'freund.rechner.mitsenden': { bereich: 'Freund', beschreibung: 'Rechner: Eingaben mitschicken', du: 'Meine Eingaben für die Auswertung mitschicken' },
  'freund.ungueltig': { bereich: 'Freund', beschreibung: 'Link ungültig', du: 'Dieses Geschenk ist leider nicht mehr verfügbar.' },
  'freund.hinweis.information': {
    bereich: 'Freund',
    beschreibung: 'Hinweis Information statt Beratung',
    du: 'Diese Seite dient der Information. Sie ersetzt keine individuelle Beratung.',
    rechtlich: true,
  },
  'freund.bewertungen': { bereich: 'Freund', beschreibung: 'Link zu echten Bewertungen (nur wenn Link gesetzt)', du: 'Echte Bewertungen ansehen' },
  'freund.form.vorname': { bereich: 'Freund', beschreibung: 'Feld Vorname', du: 'Vorname' },
  'freund.form.nachname': { bereich: 'Freund', beschreibung: 'Feld Nachname', du: 'Nachname (freiwillig)' },
  'freund.form.email': { bereich: 'Freund', beschreibung: 'Feld E-Mail', du: 'E-Mail' },
  'freund.form.telefon': {
    bereich: 'Freund',
    beschreibung: 'Feld Telefon (freiwillig)',
    du: 'Telefon (freiwillig, nur falls du lieber telefonierst)',
    sie: 'Telefon (freiwillig, nur falls Sie lieber telefonieren)',
  },

  // ---------- Bestätigungsseiten (Double-Opt-in) ----------
  'doi.ok.titel': { bereich: 'Bestätigung', beschreibung: 'Nach Klick auf Bestätigungslink', du: 'Danke, bestätigt!' },
  'doi.ok.termin': {
    bereich: 'Bestätigung',
    beschreibung: 'Termin bestätigt',
    du: 'Dein Termin am {termin} steht. Die Details haben wir dir per Mail geschickt.',
    sie: 'Ihr Termin am {termin} steht. Die Details haben wir Ihnen per Mail geschickt.',
  },
  'doi.ok.download': { bereich: 'Bestätigung', beschreibung: 'Download bestätigt', du: 'Der Link ist unterwegs in dein Postfach.', sie: 'Der Link ist unterwegs in Ihr Postfach.' },
  'doi.ok.auswertung': { bereich: 'Bestätigung', beschreibung: 'Auswertung bestätigt', du: 'Wir melden uns per Mail bei dir.', sie: 'Wir melden uns per Mail bei Ihnen.' },
  'doi.knopf': { bereich: 'Bestätigung', beschreibung: 'Button auf der Bestätigungsseite', du: 'Ja, ich bestätige' },
  'og.von': { bereich: 'Freund', beschreibung: 'Vorschaubild im Chat: Absender', du: 'Ein Geschenk von {empfehler}' },
  'og.anonym': { bereich: 'Freund', beschreibung: 'Vorschaubild im Chat ohne Namen', du: 'Ein Geschenk für dich', sie: 'Ein Geschenk für Sie' },
  'og.zeile': { bereich: 'Freund', beschreibung: 'Vorschaubild im Chat: Unterzeile', du: 'Geschenkt · Niemand ruft dich an · Du entscheidest', sie: 'Geschenkt · Niemand ruft Sie an · Sie entscheiden', rechtlich: true },
  'freund.drucken': { bereich: 'Freund', beschreibung: 'Button auf der Download-Inhaltsseite', du: 'Drucken / als PDF speichern' },
  'doi.fehler': { bereich: 'Bestätigung', beschreibung: 'Link abgelaufen/ungültig', du: 'Dieser Bestätigungslink ist abgelaufen oder ungültig.' },

  // ---------- E-Mails an Freunde (nur nach eigener Eingabe, mit Double-Opt-in) ----------
  'mail.doi.termin.betreff': { bereich: 'E-Mails', beschreibung: 'Bestätigung Termin: Betreff', du: 'Bitte bestätige deinen Termin', sie: 'Bitte bestätigen Sie Ihren Termin' },
  'mail.doi.termin.text': {
    bereich: 'E-Mails',
    beschreibung: 'Bestätigung Termin: Text',
    du: 'Hallo {vorname},\n\nbitte bestätige deinen Termin am {termin} ({ort}) mit einem Klick:\n{link}\n\nDu hast nichts angefragt? Dann ignoriere diese Mail einfach. Deine Angaben löschen wir dann automatisch.\n\nViele Grüße\n{berater}',
    sie: 'Hallo {vorname},\n\nbitte bestätigen Sie Ihren Termin am {termin} ({ort}) mit einem Klick:\n{link}\n\nSie haben nichts angefragt? Dann ignorieren Sie diese Mail einfach. Ihre Angaben löschen wir dann automatisch.\n\nViele Grüße\n{berater}',
    lang: true,
    rechtlich: true,
  },
  'mail.termin.betreff': { bereich: 'E-Mails', beschreibung: 'Terminbestätigung: Betreff', du: 'Dein Termin am {termin}', sie: 'Ihr Termin am {termin}' },
  'mail.termin.text': {
    bereich: 'E-Mails',
    beschreibung: 'Terminbestätigung: Text',
    du: 'Hallo {vorname},\n\ndein Termin steht: {termin} ({ort}).\n\n{ort_details}\n\nDu möchtest absagen oder verschieben? Antworte einfach auf diese Mail.\n\nBis bald\n{berater}',
    sie: 'Hallo {vorname},\n\nIhr Termin steht: {termin} ({ort}).\n\n{ort_details}\n\nSie möchten absagen oder verschieben? Antworten Sie einfach auf diese Mail.\n\nBis bald\n{berater}',
    lang: true,
  },
  'mail.termin.ort.online': { bereich: 'E-Mails', beschreibung: 'Details Online-Termin', du: 'Den Link zum Videogespräch schicken wir dir kurz vorher.', sie: 'Den Link zum Videogespräch schicken wir Ihnen kurz vorher.' },
  'mail.termin.ort.hamburg': { bereich: 'E-Mails', beschreibung: 'Details Vor-Ort-Termin', du: 'Adresse: AVEYO GmbH, Hartwicusstraße 3, 22087 Hamburg' },
  'mail.doi.download.betreff': { bereich: 'E-Mails', beschreibung: 'Bestätigung Download: Betreff', du: 'Kurz bestätigen, dann kommt dein Geschenk', sie: 'Kurz bestätigen, dann kommt Ihr Geschenk' },
  'mail.doi.download.text': {
    bereich: 'E-Mails',
    beschreibung: 'Bestätigung Download: Text',
    du: 'Hallo{vorname_komma}\n\ndu wolltest „{geschenk}“ per Mail bekommen. Bitte bestätige kurz:\n{link}\n\nDu warst das nicht? Dann ignoriere diese Mail einfach.\n\nViele Grüße\n{berater}',
    sie: 'Hallo{vorname_komma}\n\nSie wollten „{geschenk}“ per Mail bekommen. Bitte bestätigen Sie kurz:\n{link}\n\nSie waren das nicht? Dann ignorieren Sie diese Mail einfach.\n\nViele Grüße\n{berater}',
    lang: true,
    rechtlich: true,
  },
  'mail.download.betreff': { bereich: 'E-Mails', beschreibung: 'Download-Mail: Betreff', du: '{geschenk}' },
  'mail.download.text': {
    bereich: 'E-Mails',
    beschreibung: 'Download-Mail: Text',
    du: 'Hallo{vorname_komma}\n\nhier ist dein Geschenk: {link}\n\nWeitere Mails bekommst du von uns nur, wenn du dich selbst meldest.\n\nViele Grüße\n{berater}',
    sie: 'Hallo{vorname_komma}\n\nhier ist Ihr Geschenk: {link}\n\nWeitere Mails bekommen Sie von uns nur, wenn Sie sich selbst melden.\n\nViele Grüße\n{berater}',
    lang: true,
  },
  'mail.doi.auswertung.betreff': { bereich: 'E-Mails', beschreibung: 'Bestätigung Auswertung: Betreff', du: 'Bitte kurz bestätigen' },
  'mail.doi.auswertung.text': {
    bereich: 'E-Mails',
    beschreibung: 'Bestätigung Auswertung: Text',
    du: 'Hallo {vorname},\n\ndu möchtest eine persönliche Auswertung zu „{geschenk}“. Bitte bestätige kurz:\n{link}\n\nDanach melden wir uns per Mail. Angerufen wirst du nicht.\n\nViele Grüße\n{berater}',
    sie: 'Hallo {vorname},\n\nSie möchten eine persönliche Auswertung zu „{geschenk}“. Bitte bestätigen Sie kurz:\n{link}\n\nDanach melden wir uns per Mail. Angerufen werden Sie nicht.\n\nViele Grüße\n{berater}',
    lang: true,
    rechtlich: true,
  },
  'mail.admin.neu.betreff': { bereich: 'E-Mails', beschreibung: 'Info an Berater: Betreff', du: 'Neue Geschenk-Anfrage' },
  'mail.admin.neu.text': {
    bereich: 'E-Mails',
    beschreibung: 'Info an Berater: Text (bewusst ohne Namen)',
    du: 'Es gibt eine neue, bestätigte Anfrage zu „{geschenk}“.\n\nDetails im Admin: {link}',
    lang: true,
  },

  // ---------- Einladung Berater → Kunde ----------
  'einladung.text': {
    bereich: 'Einladung',
    beschreibung: 'Nachricht an den Kunden (vom Berater selbst verschickt)',
    du: 'Hey {vorname}, du hast gesagt, du bist zufrieden mit uns. Hier kannst du deinen Freunden ein Geschenk von uns machen: {link}',
    sie: 'Hallo {anrede_name}, Sie hatten gesagt, Sie sind zufrieden mit uns. Hier können Sie Ihren Freunden ein Geschenk von uns machen: {link}',
    lang: true,
  },
  'termin.qr.titel': { bereich: 'Einladung', beschreibung: 'Im Termin: Überschrift über dem QR-Code', du: '{vorname}, scann mal kurz mit deiner Handy-Kamera', sie: '{anrede_name}, scannen Sie kurz mit Ihrer Handy-Kamera' },
  'termin.qr.text': {
    bereich: 'Einladung',
    beschreibung: 'Im Termin: Text unter dem QR-Code',
    du: 'Dann öffnet sich dein Geschenke-Bereich. Such dir ein Geschenk aus und schick es direkt an jemanden, der dir einfällt. Dauert 30 Sekunden.',
    sie: 'Dann öffnet sich Ihr Geschenke-Bereich. Suchen Sie ein Geschenk aus und schicken Sie es direkt an jemanden, der Ihnen einfällt. Dauert 30 Sekunden.',
  },
  'erinnerung.text': {
    bereich: 'Einladung',
    beschreibung: 'Freundliche Erinnerung an den Kunden (vom Berater selbst verschickt)',
    du: 'Hey {vorname}, nur eine kleine Erinnerung, ganz ohne Druck: Falls dir jemand einfällt, dem ein Check bei uns helfen würde, hier ist nochmal dein Link mit den Geschenken für Freunde: {link}',
    sie: 'Hallo {anrede_name}, nur eine kleine Erinnerung, ganz ohne Druck: Falls Ihnen jemand einfällt, dem ein Check bei uns helfen würde, hier ist noch einmal Ihr Link mit den Geschenken für Freunde: {link}',
    lang: true,
  },
  'einladung.betreff': { bereich: 'Einladung', beschreibung: 'Betreff, falls per Mail', du: 'Ein Geschenk für deine Freunde', sie: 'Ein Geschenk für Ihre Freunde' },

  // ---------- Dankeschön ----------
  'danke.nachricht': {
    bereich: 'Dankeschön',
    beschreibung: 'Vorlage persönliche Danke-Nachricht (Versand manuell)',
    du: 'Hallo {vorname},\n\nich wollte einfach Danke sagen. Dass du an uns gedacht hast, freut mich wirklich.\n\nViele Grüße\n{berater}',
    sie: 'Hallo {anrede_name},\n\nich wollte einfach Danke sagen. Dass Sie an uns gedacht haben, freut mich wirklich.\n\nViele Grüße\n{berater}',
    lang: true,
  },
  'belohnung.spende.titel': { bereich: 'Dankeschön', beschreibung: 'Spende: Titel', du: 'Wir spenden in deinem Namen', sie: 'Wir spenden in Ihrem Namen', rechtlich: true },
  'belohnung.spende.text': {
    bereich: 'Dankeschön',
    beschreibung: 'Spende: Text',
    du: 'Als Dankeschön spenden wir einen Betrag an einen Zweck, den du aussuchst.',
    sie: 'Als Dankeschön spenden wir einen Betrag an einen Zweck, den Sie aussuchen.',
    rechtlich: true,
  },
  'belohnung.spende.zwecke': { bereich: 'Dankeschön', beschreibung: 'Spendenzwecke (mit | trennen)', du: 'Einen Baum in Deutschland pflanzen|SOS-Kinderdorf e.V.|Ärzte ohne Grenzen', rechtlich: true },
  'belohnung.erlebnis.titel': { bereich: 'Dankeschön', beschreibung: 'Erlebnis: Titel', du: 'Kaffee mit {berater}?', rechtlich: true },
  'belohnung.erlebnis.text': {
    bereich: 'Dankeschön',
    beschreibung: 'Erlebnis: Text',
    du: 'Wenn du Lust hast, lade ich dich auf einen Kaffee ein. Einfach so.',
    sie: 'Wenn Sie Lust haben, lade ich Sie auf einen Kaffee ein. Einfach so.',
    rechtlich: true,
  },
  'belohnung.doppelt.titel': { bereich: 'Dankeschön', beschreibung: 'Doppeltes Geschenk: Titel', du: 'Doppelt hält besser', rechtlich: true },
  'belohnung.doppelt.text': {
    bereich: 'Dankeschön',
    beschreibung: 'Doppeltes Geschenk: Text',
    du: 'Nach dem ersten Termin bekommen dein Freund und du eine kleine Aufmerksamkeit von uns.',
    sie: 'Nach dem ersten Termin bekommen Ihr Freund und Sie eine kleine Aufmerksamkeit von uns.',
    rechtlich: true,
  },

  // ---------- Fußzeile & Rechtliches ----------
  'footer.impressum': { bereich: 'Rechtliches', beschreibung: 'Link Impressum', du: 'Impressum' },
  'footer.datenschutz': { bereich: 'Rechtliches', beschreibung: 'Link Datenschutz', du: 'Datenschutz' },
  'footer.datenschutz.seite': { bereich: 'Rechtliches', beschreibung: 'Link Datenschutz-Hinweise dieser App', du: 'Datenschutz bei dieser Seite' },
  'footer.erstinformation': { bereich: 'Rechtliches', beschreibung: 'Link Erstinformation', du: 'Erstinformation (§ 15 VersVermV)' },
  'footer.register': { bereich: 'Rechtliches', beschreibung: 'Registerangabe in der Fußzeile', du: 'Vermittlerregister: {nr}' },
  'seite.impressum': {
    bereich: 'Rechtliches',
    beschreibung: 'Seite Impressum (nur genutzt, wenn in den Einstellungen kein Link gesetzt ist)',
    du: '# Impressum\n\nAVEYO GmbH\nHartwicusstraße 3\n22087 Hamburg\n\nVertreten durch: Timo-Maximilian Konrad und Adrian Nerhoff\nHandelsregister: HRB 196519, Amtsgericht Hamburg\n\nTelefon: 040 65055720\nE-Mail: kontakt@aveyo.de\n\nVollständiges Impressum: https://www.aveyo.de/impressum',
    lang: true,
    rechtlich: true,
  },
  'seite.datenschutz': {
    bereich: 'Rechtliches',
    beschreibung: 'Datenschutz-Hinweise zu dieser App (Ergänzung zur Datenschutzerklärung auf aveyo.de)',
    du: '# Datenschutz bei dieser Seite\n\n[ENTWURF – vor Livegang juristisch prüfen]\n\nEs gilt die Datenschutzerklärung der AVEYO GmbH: {datenschutz_url}\nErgänzend dazu für diese Geschenk-Seite:\n\n## Was wir speichern\n- Wenn Sie einen Termin oder eine Zusendung anfragen: die Angaben, die Sie selbst eingeben (Vorname, ggf. Nachname, E-Mail, freiwillig Telefon), den gewählten Termin und Ihre Einwilligungen mit Zeitpunkt.\n- Wir speichern keine Daten über Sie, die Ihnen jemand anderes mitgeteilt hat.\n- Beim Aufruf der Seite zählen wir nur anonym, dass sie geöffnet wurde. Keine Cookies, keine IP-Adresse, kein Tracking über andere Seiten.\n\n## Wofür\nAusschließlich, um Ihre Anfrage zu bearbeiten. Keine Werbung ohne Ihre ausdrückliche Einwilligung. Wir rufen Sie nicht ungefragt an.\n\n## E-Mails und Termine\nE-Mails senden wir erst, nachdem Sie Ihre Adresse über den Bestätigungslink bestätigt haben (Double-Opt-in). Für E-Mail-Versand und Terminkalender nutzen wir Google Workspace (Google Ireland Ltd.) als Auftragsverarbeiter. Bestätigte Termine werden mit Vorname und Kontaktdaten in den Kalender des Beraters eingetragen.\n\n## Löschung\nAnfragen ohne Termin löschen wir automatisch nach {loeschen_monate} Monaten, unbestätigte Anfragen nach {doi_tage} Tagen.\n\n## Hosting\nServer in der EU: [BITTE AUSFÜLLEN: Anbieter, Standort]\n\n## Ihre Rechte\nAuskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit, Widerruf von Einwilligungen mit Wirkung für die Zukunft, Beschwerde bei einer Aufsichtsbehörde.',
    lang: true,
    rechtlich: true,
  },
  'seite.erstinformation': {
    bereich: 'Rechtliches',
    beschreibung: 'Seite Erstinformation (nur genutzt, wenn in den Einstellungen kein Link gesetzt ist)',
    du: '# Erstinformation\n\nGemäß § 15 VersVermV. Vollständige Fassung: https://www.aveyo.de/erstinformationen\n\n## Name und Anschrift\nAVEYO GmbH, Hartwicusstraße 3, 22087 Hamburg\nVertreten durch Timo-Maximilian Konrad und Adrian Nerhoff\nTelefon 040 65055720, kontakt@aveyo.de\n\n## Vermittlerregister (www.vermittlerregister.info)\n- Adrian Nerhoff: D-KHWD-FFLB9-02 (§ 34d GewO), D-F-131-NTTI-65 (§ 34f GewO)\n- Timo Konrad: D-EAJS-AFQPN-81 (§ 34d GewO)\n\n## Zuständige Behörde\nHandelskammer Hamburg, Adolphsplatz 1, 20457 Hamburg\n\n## Schlichtungsstellen\n- Versicherungsombudsmann e.V., Postfach 08 06 32, 10006 Berlin, https://www.versicherungsombudsmann.de\n- Ombudsmann für die Private Kranken- und Pflegeversicherung, Postfach 06 02 22, 10052 Berlin, https://www.pkv-ombudsmann.de',
    lang: true,
    rechtlich: true,
  },
} satisfies Record<string, TextDef>;

export type TextKey = keyof typeof TEXTE;
export type Overrides = Record<string, { du?: string | null; sie?: string | null }>;

/** Platzhalter ersetzen: {name} → vars.name. Unbekannte Platzhalter werden entfernt (nichts erfinden). */
export function fuelle(vorlage: string, vars: Record<string, string | number | null | undefined> = {}): string {
  return vorlage.replace(/\{([a-z_]+)\}/g, (_, k: string) => {
    const v = vars[k];
    return v == null ? '' : String(v);
  });
}

export type Anredeform = 'herr' | 'frau' | '';
export const istAnredeform = (x: unknown): x is Anredeform => x === 'herr' || x === 'frau' || x === '';
export const istAnsprache = (x: unknown): x is Anrede | '' => x === 'du' || x === 'sie' || x === '';

/**
 * Name für die Begrüßung. Du: Vorname. Sie: „Herr Muster“ / „Frau Muster“, ohne Angabe oder ohne Nachname
 * neutral mit vollem Namen („Lisa Beispiel“). Das Geschlecht wird nie aus dem Vornamen geraten.
 */
export function anredeName(k: { vorname: string; nachname?: string | null; anrede?: string | null }, form: Anrede): string {
  const vor = (k.vorname ?? '').trim();
  const nach = (k.nachname ?? '').trim();
  if (form === 'du') return vor;
  if (nach && (k.anrede === 'herr' || k.anrede === 'frau')) return `${k.anrede === 'herr' ? 'Herr' : 'Frau'} ${nach}`;
  return `${vor} ${nach}`.trim();
}

/** Text nach Anrede holen: Admin-Überschreibung > Standard. Sie-Form fällt auf Du-Form zurück, wenn es keine gibt. */
export function rohtext(key: string, anrede: Anrede, overrides: Overrides = {}): string {
  const def = (TEXTE as Record<string, TextDef>)[key];
  const o = overrides[key];
  if (anrede === 'sie') {
    if (o?.sie) return o.sie;
    if (def?.sie) return def.sie;
  }
  if (o?.du) return o.du;
  return def?.du ?? key;
}

export function text(key: TextKey | string, anrede: Anrede, overrides: Overrides = {}, vars: Record<string, string | number | null | undefined> = {}) {
  return fuelle(rohtext(key, anrede, overrides), vars);
}

/** Alle Texte für die Oberfläche als flaches Objekt (an Client-Komponenten übergeben). */
export function textPaket(anrede: Anrede, overrides: Overrides = {}, praefixe: string[] = []): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(TEXTE)) {
    if (praefixe.length && !praefixe.some((p) => key.startsWith(p))) continue;
    out[key] = rohtext(key, anrede, overrides);
  }
  return out;
}

/** Liste der rechtlich zu prüfenden Texte (für README/Admin). */
export function rechtlichePruefliste(): { key: string; bereich: string; beschreibung: string }[] {
  return Object.entries(TEXTE as Record<string, TextDef>)
    .filter(([, d]) => d.rechtlich)
    .map(([key, d]) => ({ key, bereich: d.bereich, beschreibung: d.beschreibung }));
}

/** Sehr einfacher Textsatz für Rechtsseiten und Download-Inhalte: # Überschrift, ## Unterüberschrift, - Liste, Absätze. */
export type Block = { typ: 'h1' | 'h2' | 'p' | 'ul'; text?: string; punkte?: string[] };
export function bloecke(quelle: string): Block[] {
  const out: Block[] = [];
  let absatz: string[] = [];
  let liste: string[] | null = null;
  const flush = () => {
    if (absatz.length) out.push({ typ: 'p', text: absatz.join('\n') });
    absatz = [];
    if (liste) out.push({ typ: 'ul', punkte: liste });
    liste = null;
  };
  for (const zeile of quelle.replace(/\r/g, '').split('\n')) {
    const z = zeile.trimEnd();
    if (!z.trim()) {
      flush();
    } else if (z.startsWith('## ')) {
      flush();
      out.push({ typ: 'h2', text: z.slice(3).trim() });
    } else if (z.startsWith('# ')) {
      flush();
      out.push({ typ: 'h1', text: z.slice(2).trim() });
    } else if (/^\s*[-•]\s+/.test(z)) {
      if (absatz.length) {
        out.push({ typ: 'p', text: absatz.join('\n') });
        absatz = [];
      }
      (liste ??= []).push(z.replace(/^\s*[-•]\s+/, ''));
    } else {
      if (liste) {
        out.push({ typ: 'ul', punkte: liste });
        liste = null;
      }
      absatz.push(z);
    }
  }
  flush();
  return out;
}
