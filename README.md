# AVEYO Geschenk-Empfehlung

Kunden verschenken etwas Wertvolles an Freunde (einen PKV-Beitragscheck, eine Zweitmeinung, einen Rechner, eine Checkliste),
statt „einen Berater zu vermitteln“. Der Freund entscheidet selbst, ob und wann er sich meldet. **Niemand ruft ihn an.**
Geteilt wird ausschließlich über die eigenen Apps des Kunden; die App selbst schreibt nie an Freunde.

Eigene App im Unterordner `geschenk/` dieses Repositorys: eigene Datenbank, eigener Login, eigener Port (3200).
Gleicher Stack und Stil wie Immo-Match und FinanzCRM. Lässt sich bei Bedarf mit `git subtree split -P geschenk` in ein eigenes Repository herauslösen.

## Schnellstart (lokal, in 2 Minuten durchklicken)

```bash
cd geschenk
npm install
cp .env.example .env.local
# SESSION_SECRET füllen:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
# zum lokalen Durchklicken ohne Authenticator-App: GESCHENK_2FA=aus
npm run seed        # 2 Berater, 4 Geschenke, Nachrichtenvorlagen, 3 erfundene Beispiel-Kunden – gibt die Magic-Links aus
npm run dev         # http://localhost:3200
```

- **Admin:** http://localhost:3200/admin → `adrian@example.org` / `geschenk-demo-2026` (beim ersten Login wird 2FA eingerichtet, außer `GESCHENK_2FA=aus`)
- **Empfehler:** den von `npm run seed` ausgegebenen Link von „Lisa Beispiel“ öffnen (am besten in der Handy-Ansicht des Browsers)
- **Freund:** im Empfehler-Bereich „Text + Link kopieren“, Link in neuem Tab öffnen
- **Mails:** ohne SMTP landen alle Mails im Admin unter **Postausgang** – dort den Bestätigungslink anklicken

## Die drei Flows

| Wer | Wo | Was |
|---|---|---|
| Berater | `/admin` | Login mit Passwort + TOTP-2FA. Kunden anlegen/CSV-Import, Einladungslink + fertigen WhatsApp-/Mail-Text kopieren, Geschenke, Nachrichtenvorlagen (A/B), Anfragen mit Status, Dankeschön, Texte, Einstellungen, Dashboard |
| Empfehler | `/k/<magic-token>` | Kein Login. Begrüßung, 2–4 passende Geschenke, eigener Satz (Vorschläge antippen), Ton wählen (locker/kurz/ausführlich), Text editierbar, Vorschau der Freund-Seite, Teilen per WhatsApp/Signal/Telegram/E-Mail/Kopieren/Teilen-Menü, QR-Code, „Meine Wirkung“, Danke-Bereich (erst nach der ersten Einlösung) |
| Freund | `/g/<code>` | „Lisa schenkt dir …“, Zitat, Nutzen, Ablauf, Dauer, Kosten 0 €, Versprechen „Niemand ruft dich an“. Einlösen: Termin (eigener Slot-Picker oder Cal.com/Calendly-Link), Download (sofort, Mail nur optional mit Double-Opt-in), Rechner (sofort, Auswertung optional). Freiwillige Einwilligung „Lisa darf es erfahren“. Weitergeben erst nach dem Einlösen |

## Annahmen und bewusste Abweichungen vom Vorschlag

1. **SQLite (`node:sqlite`) statt Postgres/Prisma.** Gleicher Stack wie eure beiden anderen Apps (eine Person kann alle drei pflegen), keine zusätzliche Datenbank,
   kein weiterer Auftragsverarbeiter, Backup = eine Datei. Die Datenmenge (Kunden, Links, Anfragen) ist klein. Alle Zugriffe sind rohes SQL in `src/lib/*.ts` – ein späterer Umzug auf Postgres betrifft nur diese Dateien.
2. **Hosting: ein kleiner EU-Server (z. B. Hetzner, Falkenstein/Nürnberg) statt Vercel + Supabase.** Die Freund-Seiten müssen öffentlich erreichbar sein
   (anders als Immo-Match, das nur per Tailscale läuft). Ein Server in Deutschland mit Caddy (automatisches HTTPS) ist datenschutzrechtlich am einfachsten: ein AVV (Hoster) + einer (Mail-Anbieter).
3. **Eigener Slot-Picker als Standard,** Cal.com/Calendly optional (Einstellungen → Terminbuchung: extern + Link im Profil). Grund: keine Drittanbieter-Cookies auf der Freund-Seite, kein weiterer AVV.
   Der eigene Picker kennt allerdings eure Outlook-/Google-Kalender nicht – belegte Zeiten außerhalb der App müssen über die Verfügbarkeit gesteuert werden (siehe offene Fragen).
4. **Tracking ohne Cookies und ohne IP-Adressen:** Die App zählt nur anonyme Ereignisse (geöffnet, eingelöst …) je Link. Link-Vorschau-Bots (WhatsApp & Co.) zählen nicht. Kein Plausible/Umami nötig; lässt sich zusätzlich einbinden.
5. **Admin-Login: Passwort + TOTP (Authenticator-App)** statt E-Mail-Magic-Link – unabhängig vom Mail-Versand und phishing-robuster als Mail-Links.
6. **Double-Opt-in per Knopfdruck:** Der Bestätigungslink öffnet eine Seite mit „Ja, ich bestätige“. So bestätigen Mail-Virenscanner, die Links automatisch öffnen, nicht versehentlich.
7. **Termin wird nach dem Double-Opt-in gebucht.** Bis zur Bestätigung ist der Slot reserviert; unbestätigte Anfragen werden nach `doiTage` (Standard 7) gelöscht.
8. **Download-Inhalte** können als PDF hochgeladen oder als Text gepflegt werden (druckbare Seite, „Als PDF speichern“). Die Beispiel-Checkliste ist als Beispielinhalt markiert.
9. **Weitergabe durch Freunde** erzeugt einen neuen Link (optional mit dem Vornamen des Freundes). Einlösungen daraus zählen in der Wirkung des ursprünglichen Empfehlers mit, ohne Namen.
10. **Admin-Oberfläche** (Menüs, Beschriftungen) ist fest auf Deutsch; **alle Texte, die Kunden und Freunde sehen** (Seiten, Mails, Nachrichten, Rechtsseiten, Vorschaubild), sind im Admin unter „Texte“ änderbar, je in Du- und Sie-Form.
11. Farben sind ein warmer Platzhalter (`src/lib/theme.ts`), bis die echten AVEYO-Farben/Logo im Admin eingetragen sind.

## Rückfragen an Adrian (beeinflussen die nächsten Schritte, nicht den jetzigen Stand)

1. **Kalender:** Sollen Termine mit eurem Outlook/Google-Kalender abgeglichen werden (dann ist Cal.com als Zwischenschicht der einfachste Weg) oder reicht die feste Wochen-Verfügbarkeit?
2. **Hosting:** Ist ein eigener kleiner Server (Hetzner) in Ordnung, oder soll es bewusst eine Managed-Plattform sein?
3. **Domain:** Unter welcher Adresse soll es laufen (z. B. `geschenk.aveyo.de`)? Die Adresse steht in jedem geteilten Link.
4. **Mail-Anbieter:** Brevo (Paris) oder Postmark (EU-Region)? Absender, z. B. `hallo@aveyo.de`?
5. **Dankeschön:** Welche Spendenzwecke (3 Organisationen) und ob „Erlebnis“/„Doppeltes Geschenk“ überhaupt angeboten werden sollen (rechtliche Prüfung vorausgesetzt).

## Umgebungsvariablen

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `SESSION_SECRET` | ja | ≥ 24 Zeichen. Signiert Sitzungen, verschlüsselt gespeicherte Magic-Links und 2FA-Geheimnisse. **Nicht ändern**, sonst sind alle Kunden-Links neu zu erzeugen |
| `GESCHENK_BASE_URL` | ja | Öffentliche Adresse ohne `/` am Ende, z. B. `https://geschenk.aveyo.de` |
| `GESCHENK_HTTPS` | produktiv | `1` = Cookies nur über HTTPS |
| `GESCHENK_2FA` | – | `an` (Standard). Nur lokal `aus` |
| `GESCHENK_DATA_DIR` | – | Datenordner (Standard `./data`): `geschenk.db`, `dateien/`, `postausgang/` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | produktiv | EU-Mailanbieter. Ohne `SMTP_HOST` → Entwicklungs-Postausgang |

## Befehle

```
npm run dev          # Port 3200
npm test             # Unit-Tests (Token, 2FA, Einwilligung, Texte, Teilen, Slots, Rechner, CSV, Statistik, Löschkonzept, Webhook)
npm run test:e2e     # Playwright: die drei Hauptflows (vorher npm run build)
npx tsc --noEmit     # Typcheck
npm run build
npm run seed         # Beispieldaten (idempotent)
npm run admin:add -- "Name" mail@aveyo.de "passwort-mit-12-zeichen"   # Zugang anlegen / Passwort + 2FA zurücksetzen
```

## Deployment (Vorschlag: Hetzner Cloud CX22, Ubuntu 24.04, Standort Deutschland)

1. Server anlegen, AVV mit Hetzner abschließen (im Kundenkonto). DNS: `geschenk.aveyo.de` → Server-IP.
2. Node.js 22 installieren (`curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs`) und Caddy (`sudo apt install caddy`).
3. Code holen und bauen:
   ```bash
   git clone https://github.com/niccoloascending-lang/immo-crm.git /opt/aveyo && cd /opt/aveyo/geschenk
   npm ci && cp .env.example .env.local   # ausfüllen: SESSION_SECRET, GESCHENK_BASE_URL, GESCHENK_HTTPS=1, SMTP_*
   npm test && npm run build
   npm run admin:add -- "Adrian" adrian@aveyo.de "…"
   ```
4. Dienst `/etc/systemd/system/geschenk.service`:
   ```ini
   [Unit]
   Description=AVEYO Geschenk-Empfehlung
   After=network.target
   [Service]
   WorkingDirectory=/opt/aveyo/geschenk
   ExecStart=/usr/bin/npm start
   Restart=always
   User=www-data
   Environment=NODE_ENV=production
   [Install]
   WantedBy=multi-user.target
   ```
   `sudo chown -R www-data /opt/aveyo/geschenk/data && sudo systemctl enable --now geschenk`
5. Caddy `/etc/caddy/Caddyfile`:
   ```
   geschenk.aveyo.de {
     reverse_proxy localhost:3200
     header Strict-Transport-Security "max-age=31536000"
   }
   ```
   Port 3200 per Firewall nur lokal erreichbar lassen (`ufw allow 80,443/tcp`).
6. **Backup:** `data/` täglich sichern (z. B. `sqlite3 data/geschenk.db ".backup /backup/geschenk-$(date +%F).db"` per Cron + Hetzner-Snapshots).
7. **Update:** `git pull && npm ci && npm test && npm run build && sudo systemctl restart geschenk`.

## CRM-Anbindung

**Webhook** (Einstellungen → CRM-Anbindung): Jede bestätigte Freund-Anfrage und jede Statusänderung wird als JSON per `POST` geschickt, mit Wiederholungen (1 min … 12 h).
Header: `X-Geschenk-Zeit` (Unix-Sekunden) und `X-Geschenk-Signatur: sha256=<HMAC-SHA256(geheimnis, "<zeit>.<body>")>`. Prüfbeispiel: `pruefeWebhook` in `src/lib/webhook-pure.ts`.

```json
{ "ereignis": "anfrage.bestaetigt", "zeit": "2026-10-24T10:55:06Z",
  "anfrage": { "id": 1, "typ": "termin", "status": "termin", "bestaetigt": "…",
    "freund": { "vorname": "Erika", "nachname": null, "email": "erika@example.org", "telefon": null },
    "termin": { "start": "2026-10-26T08:00:00.000Z", "ort": "online" },
    "geschenk": { "id": 1, "titel": "Kostenloser PKV-Beitragscheck" },
    "empfehler": { "id": 1, "extern_id": "DEMO-1", "vorname": "Lisa", "nachname": "Beispiel" },
    "einwilligungen": [{ "art": "datenschutz", "erteilt": "…", "bestaetigt": "…" }] } }
```

**REST-API** (API-Key in den Einstellungen erzeugen, `Authorization: Bearer gk_…`):
- `GET /api/v1/anfragen?seit=2026-01-01T00:00:00Z` – bestätigte Anfragen (gleiches Format wie oben)
- `POST /api/v1/kunden` `{ vorname, nachname, email, handy?, themen?, extern_id? }` – legt an oder aktualisiert (über `extern_id`, sonst E-Mail) und gibt den Magic-Link zurück. Es wird nichts verschickt.

**CSV-Import:** Admin → Kunden → CSV-Import (Spalten `Vorname;Nachname;E-Mail;Handy;Themen;Kundennummer`), mit Probelauf und Fehlerliste je Zeile.

## Recht & Datenschutz – wie es umgesetzt ist

- **Kein Versand an Freunde durch die App** (UWG § 7). Es gibt keine Eingabefelder für Kontaktdaten Dritter; WhatsApp/Telegram/Mail öffnen sich auf dem Gerät des Kunden (`wa.me`, `t.me/share`, `mailto:`).
  Auch Einladungen an Kunden und Danke-Nachrichten verschickt der Berater selbst (Kopieren / eigene App).
- **E-Mails an Freunde** nur an selbst eingegebene Adressen und nur mit Double-Opt-in. Ohne Bestätigung keine weitere Mail; Löschung nach `doiTage`.
- **Einwilligungen** mit Wortlaut und Zeitstempel (erteilt, bestätigt, widerrufen) in `einwilligungen`; im Admin je Anfrage einsehbar, „Empfehler informieren“ widerrufbar.
- **Empfehler sieht nur Zahlen;** Namen nur bei aktiver, nicht vorausgewählter Einwilligung und bestätigter Anfrage.
- **Löschkonzept** (Einstellungen): unbestätigt nach 7 Tagen, ohne Termin bzw. „kein Interesse“ nach 6 Monaten (konfigurierbar), läuft automatisch im Hintergrund. Kunden-Löschung entfernt Zitate.
- **Datensparsamkeit:** keine IP-Adressen, keine Cookies außer dem Admin-Sitzungscookie, Rechner-Eingaben bleiben im Browser (außer der Freund schickt sie aktiv mit).
- **Belohnungen:** Standard nur die persönliche Danke-Nachricht; Spende/Erlebnis/Doppeltes Geschenk einzeln abschaltbar, mit Hinweis zur rechtlichen Prüfung; keine Geldprämien vorgesehen.
- **Pflichtangaben** (Impressum, Datenschutz, Erstinformation, Registernummer) in der Fußzeile jeder öffentlichen Seite; Inhalte im Admin unter „Texte → Rechtliches“.
- **Keine erfundenen Bewertungen:** Bewertungen erscheinen nur als Link, wenn ein echter Link eingetragen ist.

## Rechtlich zu prüfende Texte

Im Admin unter „Texte“ mit ⚖️ markiert. Platzhalter `[BITTE AUSFÜLLEN]` in Impressum, Datenschutz und Erstinformation müssen vor dem Livegang ersetzt werden.

| Schlüssel | Bereich | Inhalt |
|---|---|---|
| `kunde.versprechen` | Empfehler | Versprechen an den Empfehler |
| `kunde.danke.text` | Empfehler | Danke-Bereich Text (erscheint erst nach der ersten Einlösung) |
| `freund.versprechen` | Freund | Das zentrale Versprechen (null Druck) |
| `freund.termin.formular` | Freund | Hinweis über dem Formular |
| `freund.download.mail.hinweis` | Freund | Erklärung Double-Opt-in Download |
| `freund.rechner.hinweis` | Freund | Hinweis unter dem Rechner |
| `freund.einwilligung.empfehler` | Freund | Freiwillige Einwilligung (nicht vorausgewählt) |
| `freund.einwilligung.datenschutz` | Freund | Pflicht-Hinweis bei Formularen |
| `freund.hinweis.information` | Freund | Hinweis Information statt Beratung |
| `og.zeile` | Freund | Vorschaubild im Chat: Unterzeile |
| `mail.doi.termin.text` | E-Mails | Bestätigung Termin: Text |
| `mail.doi.download.text` | E-Mails | Bestätigung Download: Text |
| `mail.doi.auswertung.text` | E-Mails | Bestätigung Auswertung: Text |
| `belohnung.spende.titel` | Dankeschön | Spende: Titel |
| `belohnung.spende.text` | Dankeschön | Spende: Text |
| `belohnung.spende.zwecke` | Dankeschön | Spendenzwecke (mit | trennen) |
| `belohnung.erlebnis.titel` | Dankeschön | Erlebnis: Titel |
| `belohnung.erlebnis.text` | Dankeschön | Erlebnis: Text |
| `belohnung.doppelt.titel` | Dankeschön | Doppeltes Geschenk: Titel |
| `belohnung.doppelt.text` | Dankeschön | Doppeltes Geschenk: Text |
| `seite.impressum` | Rechtliches | Seite Impressum |
| `seite.datenschutz` | Rechtliches | Seite Datenschutzhinweise |
| `seite.erstinformation` | Rechtliches | Seite Erstinformation / Statusangaben |

Außerdem prüfen: die Inhalte der Geschenke (Titel, Nutzen, Checkliste – Beispielinhalte), die Nachrichtenvorlagen und die Formulierung „§ 204 VVG“ im Beispiel-Geschenk.

## Stand der Phasen

- **Phase 1 (MVP):** ✅ Kunden + Geschenke anlegen → Magic-Link → Geschenk wählen, Satz schreiben, teilen → Freund-Landingpage → Termin buchen / Download → Anfrage im Admin.
- **Phase 2:** ✅ Wirkung-Anzeige mit Freudenmoment, Einwilligung „Empfehler darf es erfahren“, Dankeschön-Workflow, dynamische OG-Bilder (`/g/<code>/opengraph-image`), QR-Code.
- **Phase 3:** ✅ Dashboard mit Conversion je Geschenk, Nachrichtenvorlage und Kanal, A/B-Test der Nachrichtentexte, CRM-Webhook + REST-API, CSV-Import.

Noch offen / Ideen: Kalenderabgleich (siehe Rückfrage 1), Lighthouse-Messung auf dem Produktivserver (lokal: Freund-Seite ~100 kB JS, serverseitig gerendert),
Sitzungen nach Passwortwechsel sofort beenden, eigene Bewertungs-Einbindung.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/lib/token.ts, totp.ts, geheim.ts` | Magic-Links (256 Bit, nur Hash gespeichert), Freund-Codes, Signaturen, Passwörter, TOTP (RFC 6238), Verschlüsselung. **Rein** |
| `src/lib/texte.ts` | Zentraler Textkatalog (Du/Sie, Platzhalter, ⚖️-Markierung). **Rein** |
| `src/lib/teilen.ts, einwilligung.ts, slots.ts, rechner.ts, csv.ts, statistik.ts, loeschung.ts, webhook-pure.ts, theme.ts, validierung.ts` | Fachlogik. **Rein**, mit Tests in `tests/` |
| `src/lib/db.ts` | Schema und Helfer |
| `src/lib/kunden.ts, teilungen.ts, anfragen.ts, empfehler.ts, webhook.ts, mail.ts, hintergrund.ts` | Logik mit DB |
| `src/app/k, g, bestaetigen, info` | Öffentliche Seiten (Empfehler, Freund, Double-Opt-in, Rechtsseiten) |
| `src/app/admin, api/admin` | Berater-Bereich (geschützt über `src/middleware.ts`) |
| `src/app/api/v1` | REST-API fürs CRM |
| `e2e/` | Playwright-Tests der Hauptflows |
