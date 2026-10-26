# Server einrichten bei Hetzner – Schritt für Schritt

Dauer: etwa 45 Minuten, davon viel Warten. Kosten: rund 5–7 € im Monat (Server, IPv4-Adresse, Backups; aktuelle Preise bei Hetzner).
Am Ende läuft die App unter `https://geschenk.aveyo.de` mit HTTPS, täglicher Sicherung, automatischen Sicherheitsupdates und einem Update-Befehl.

Was du brauchst: Zugang zu Hetzner (neu anlegen), zur Verwaltung der Domain aveyo.de (DNS), zur Google Admin-Konsole und zu GitHub.

---

## 1. SSH-Schlüssel auf deinem PC erzeugen (einmalig)

Der Schlüssel ist dein „Hausschlüssel“ für den Server. Ein Passwort zum Erraten gibt es dann nicht.
PowerShell öffnen und eingeben:

```powershell
ssh-keygen -t ed25519 -C "adrian-pc"
```

Dreimal Enter drücken (Speicherort übernehmen, Passphrase empfohlen, aber optional). Dann den **öffentlichen** Teil anzeigen und kopieren:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

Die Zeile beginnt mit `ssh-ed25519 …`. Die Datei **ohne** `.pub` bleibt geheim auf deinem PC.

## 2. Hetzner-Konto und Datenschutzvertrag

1. Auf https://www.hetzner.com → „Cloud“ ein Konto anlegen und verifizieren (Firma AVEYO GmbH).
2. Im Kundenkonto (https://accounts.hetzner.com) unter **Datenschutz** den **Auftragsverarbeitungsvertrag (AVV)** abschließen.

## 3. Server anlegen

https://console.hetzner.cloud → neues Projekt „AVEYO“ → **Server hinzufügen**:

| Feld | Auswahl |
|---|---|
| Standort | **Nürnberg** oder **Falkenstein** (Deutschland) |
| Image | **Ubuntu 24.04** |
| Typ | Shared vCPU, kleinster Typ mit **4 GB RAM** (z. B. CX22 bzw. dessen Nachfolger) |
| Netzwerk | **IPv4** und IPv6 an (IPv4 wird für Google-Mail gebraucht) |
| SSH-Keys | „SSH-Key hinzufügen“ → die Zeile aus Schritt 1 einfügen, Name „Adrian PC“ |
| Backups | **an** (Kopie außerhalb des Servers, ca. 20 % Aufpreis) |
| Name | `geschenk` |

„Kostenpflichtig erstellen“. Nach einer Minute steht die **IPv4-Adresse** da (z. B. `95.217.12.34`), die brauchst du gleich mehrmals.

## 4. Adresse geschenk.aveyo.de einrichten (DNS)

Dort, wo die Domain aveyo.de verwaltet wird (Domain-Anbieter oder Agentur der Website), einen neuen Eintrag anlegen:

| Typ | Name | Wert |
|---|---|---|
| A | `geschenk` | IPv4-Adresse des Servers |
| AAAA (optional) | `geschenk` | IPv6-Adresse des Servers |

Die Website www.aveyo.de bleibt davon unberührt. Es dauert meist Minuten, manchmal bis zu ein paar Stunden.

## 5. Google: Mailversand vom Server erlauben (SMTP-Relay)

https://admin.google.com → Apps → Google Workspace → Gmail → **Routing** → „SMTP-Relay-Dienst“ → **Konfigurieren**:

- Name: `Geschenk-Server`
- Zulässige Absender: **Nur Adressen in meinen Domains**
- Authentifizierung: **Nur E-Mails von den angegebenen IP-Adressen annehmen** → IPv4-Adresse des Servers eintragen
- **TLS-Verschlüsselung erforderlich**: an
- Speichern (wirkt meist nach wenigen Minuten)

## 6. Server einrichten

PowerShell, IP-Adresse einsetzen. Beim ersten Mal fragt SSH nach dem „Fingerprint“ → `yes`.

```powershell
ssh root@95.217.12.34
```

Du bist jetzt auf dem Server (Eingabezeile `root@geschenk:~#`). **Block A** komplett kopieren, einfügen, Enter:

```bash
ssh-keygen -t ed25519 -N "" -C "geschenk-server" -f /root/.ssh/github_geschenk
printf 'Host github.com\n  IdentityFile /root/.ssh/github_geschenk\n  IdentitiesOnly yes\n' >> /root/.ssh/config
ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null
cat /root/.ssh/github_geschenk.pub
```

Die angezeigte Zeile (`ssh-ed25519 …`) kopieren und bei GitHub hinterlegen. Damit darf der Server den Code **nur lesen**:
GitHub → Repository `aveyo-empfehlungs-software` → **Settings** → **Deploy keys** → **Add deploy key** → Titel `Hetzner-Server`,
Zeile einfügen, **„Allow write access“ NICHT anhaken** → Add key.

Zurück in PowerShell, **Block B**:

```bash
git clone git@github.com:niccoloascending-lang/aveyo-empfehlungs-software.git /opt/geschenk/quelle
bash /opt/geschenk/quelle/deploy/einrichten.sh
```

Das Skript fragt drei Dinge:
1. **Adresse:** Enter (`geschenk.aveyo.de`)
2. **E-Mail:** `1` (SMTP-Relay aus Schritt 5)
3. **Erster Zugang:** dein Name, deine E-Mail, ein Passwort (mind. 12 Zeichen, die Eingabe bleibt unsichtbar)

Dann läuft es etwa 5 Minuten durch (Updates, Node.js, Webserver, App bauen und testen). Am Ende steht „Fertig.“ mit einer Übersicht.
Meldet es „DNS zeigt auf …“, ist Schritt 4 noch nicht angekommen. Das ist kein Problem, das HTTPS-Zertifikat kommt dann automatisch, sobald der Eintrag stimmt.

## 7. Erster Login und Start

1. https://geschenk.aveyo.de/admin → anmelden → 2FA mit der Authenticator-App einrichten.
2. Timo anlegen (auf dem Server): `geschenk-admin "Timo" timo@aveyo.de` (fragt das Passwort ab). Timo richtet seine 2FA beim ersten Login ein.
3. Jeder unter **Einstellungen → Mein Profil**: Foto, Vorstellung, Kalender-ID.
4. **Geschenke** durchgehen: Inhalte mit „[Beispielinhalt …]“ ersetzen. **Texte** mit ⚖️ juristisch prüfen lassen (Liste in der README).
5. **Testlauf:** dich selbst als Kunde anlegen → Link öffnen → Geschenk an dich selbst schicken → als „Freund“ einen Termin buchen → Bestätigungsmail muss ankommen.
6. Danach den Testkunden wieder löschen und loslegen.

Die Daten von deinem PC (lokale Vorschau) werden nicht übernommen: Der Server startet sauber, ohne Demo-Kunden und Demo-Zugänge.
Fotos, Logo und geänderte Texte bitte einmal neu hochladen bzw. eintragen.

---

## Im Alltag

Alles auf dem Server, nach `ssh root@<IP>`:

| Was | Befehl |
|---|---|
| **Update** auf den neuesten Stand von GitHub | `geschenk-update` |
| Zurück auf die vorige Version | `geschenk-update --zurueck` |
| Zugang anlegen / Passwort + 2FA zurücksetzen | `geschenk-admin "Name" mail@aveyo.de` |
| Protokoll der App ansehen | `journalctl -u geschenk -n 100` |
| Protokoll HTTPS/Webserver | `journalctl -u caddy -n 50` |
| Sicherung sofort | `geschenk-sicherung` |
| Einstellungen ändern | `nano /etc/geschenk/geschenk.env`, danach `systemctl restart geschenk` |

**Wie ein Update abläuft:** Die neue Version wird in einem eigenen Ordner installiert, getestet und gebaut. Die laufende App merkt davon nichts.
Schlagen Tests oder Build fehl, bleibt alles wie es war. Vor dem Umschalten wird gesichert. Antwortet die neue Version nach dem Umschalten nicht,
geht es automatisch zurück auf die vorige. Die Ausfallzeit beim Umschalten liegt bei wenigen Sekunden.

**Wo was liegt:**

| Pfad | Inhalt |
|---|---|
| `/var/lib/geschenk/` | Datenbank und hochgeladene Dateien (Fotos, Videos, PDFs) |
| `/etc/geschenk/geschenk.env` | Einstellungen inkl. `SESSION_SECRET` (**nie ändern**, sonst werden alle Kunden-Links ungültig) |
| `/var/backups/geschenk/` | Tägliche Sicherung 03:15 Uhr, Datenbank 30 Tage |
| `/opt/geschenk/releases/` | Die letzten drei Versionen der App |

## Sicherung zurückspielen

```bash
ls /var/backups/geschenk/                     # gewünschtes Datum aussuchen
systemctl stop geschenk
rm -f /var/lib/geschenk/geschenk.db-wal /var/lib/geschenk/geschenk.db-shm
gunzip -c /var/backups/geschenk/geschenk-2026-11-03-0315.db.gz > /var/lib/geschenk/geschenk.db
chown geschenk:geschenk /var/lib/geschenk/geschenk.db
systemctl start geschenk
```

Ist der ganze Server kaputt: In der Hetzner-Konsole unter **Backups** einen Stand wiederherstellen (das ganze System von einem der letzten 7 Tage).

## Google-Kalender (später)

1. Dienstkonto-Schlüssel wie in der README beschrieben erzeugen und vom PC hochladen (PowerShell, im Ordner der Datei):
   `scp .\google-dienstkonto.json root@<IP>:/etc/geschenk/google-dienstkonto.json`
2. Auf dem Server:
   ```bash
   chown root:geschenk /etc/geschenk/google-dienstkonto.json && chmod 640 /etc/geschenk/google-dienstkonto.json
   sed -i 's/^# GOOGLE_SERVICE_ACCOUNT_FILE/GOOGLE_SERVICE_ACCOUNT_FILE/' /etc/geschenk/geschenk.env
   systemctl restart geschenk
   ```
3. Im Admin unter Einstellungen → Mein Profil „Kalender testen“.

## Weitere Person mit Server-Zugang (z. B. Timo)

Timo erzeugt Schritt 1 auf seinem PC und schickt dir die `.pub`-Zeile. Auf dem Server:
`echo "ssh-ed25519 AAAA… timo-pc" >> /root/.ssh/authorized_keys`

## Was das Einrichtungsskript zur Sicherheit macht

- Firewall: nur SSH (22), HTTP (80, leitet auf HTTPS um) und HTTPS (443) offen. Die App selbst ist nur intern erreichbar.
- SSH nur mit Schlüssel, Passwort-Anmeldung aus.
- Sicherheitsupdates werden automatisch eingespielt.
- Die App läuft als eigener Benutzer `geschenk` mit eingeschränkten Rechten. Die Einstellungsdatei ist nur für root und die App lesbar.
- HTTPS-Zertifikat (Let's Encrypt) über Caddy, verlängert sich selbst.
- Keine Zugriffsprotokolle mit IP-Adressen (passend zum Datenschutztext).
