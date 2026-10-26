#!/usr/bin/env bash
# Einmalige Einrichtung des Servers (Ubuntu 24.04, als root). Anleitung: deploy/ANLEITUNG.md
# Darf erneut ausgeführt werden: Vorhandene Einstellungen (vor allem SESSION_SECRET) bleiben erhalten.
#
#   bash /opt/geschenk/quelle/deploy/einrichten.sh
set -euo pipefail

QUELLE=/opt/geschenk/quelle
DATEN=/var/lib/geschenk
ETC=/etc/geschenk
ENV_DATEI=$ETC/geschenk.env
SICHERUNG=/var/backups/geschenk

schritt() { printf '\n\033[1;34m== %s\033[0m\n' "$*"; }
hinweis() { printf '\033[0;33m%s\033[0m\n' "$*"; }

[ "$(id -u)" = 0 ] || { echo "Bitte als root ausführen."; exit 1; }
[ -d "$QUELLE/.git" ] || { echo "Erst das Repository nach $QUELLE klonen (siehe ANLEITUNG.md)."; exit 1; }
. /etc/os-release
[ "${ID:-}" = ubuntu ] || hinweis "Getestet für Ubuntu 24.04 – hier läuft ${PRETTY_NAME:-unbekannt}."

# ---------- Fragen (nur beim ersten Mal) ----------
if [ ! -f "$ENV_DATEI" ]; then
  schritt "Ein paar Angaben"
  read -rp "Adresse der App [geschenk.aveyo.de]: " DOMAIN
  DOMAIN=${DOMAIN:-geschenk.aveyo.de}
  echo
  echo "E-Mail-Versand über Google Workspace (Absender kontakt@aveyo.de):"
  echo "  1) SMTP-Relay (empfohlen, Server-IP in der Google Admin-Konsole freigeben)"
  echo "  2) Konto mit App-Passwort"
  echo "  3) später einrichten (bis dahin landen Mails nur im Admin unter „Postausgang“)"
  read -rp "Auswahl [1]: " MAILART
  MAILART=${MAILART:-1}
  SMTP_USER=""; SMTP_PASS=""
  if [ "$MAILART" = 2 ]; then
    read -rp "Google-Konto (z. B. kontakt@aveyo.de): " SMTP_USER
    read -rsp "App-Passwort (16 Zeichen, Eingabe unsichtbar): " SMTP_PASS; echo
  fi
fi

schritt "System aktualisieren und Pakete installieren"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
# Geänderte Konfigurationsdateien (z. B. von Hetzner) behalten, nicht nachfragen
APT_OPT=(-o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)
apt-get upgrade -yq "${APT_OPT[@]}"
apt-get install -yq "${APT_OPT[@]}" curl ca-certificates gnupg ufw sqlite3 rsync unattended-upgrades debian-keyring debian-archive-keyring apt-transport-https
timedatectl set-timezone Europe/Berlin || true
# Sicherheitsupdates automatisch einspielen
dpkg-reconfigure -f noninteractive unattended-upgrades

if ! node -v 2>/dev/null | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -yq nodejs
fi
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q
  apt-get install -yq caddy
fi
echo "Node $(node -v), $(caddy version | cut -d' ' -f1)"

schritt "Auslagerungsspeicher (für den Build)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

schritt "Firewall: nur SSH, HTTP und HTTPS"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443 >/dev/null
ufw --force enable >/dev/null
ufw status | sed -n '1,10p'

schritt "SSH nur mit Schlüssel"
if [ -s /root/.ssh/authorized_keys ]; then
  printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/10-geschenk.conf
  systemctl reload ssh || systemctl reload sshd || true
  echo "Passwort-Anmeldung abgeschaltet."
else
  hinweis "Kein SSH-Schlüssel für root hinterlegt – Passwort-Anmeldung bleibt an. Bitte Schlüssel hinterlegen (ANLEITUNG.md)."
fi

schritt "Benutzer und Ordner"
id geschenk >/dev/null 2>&1 || useradd --system --home-dir /opt/geschenk --shell /usr/sbin/nologin geschenk
mkdir -p /opt/geschenk/releases "$DATEN" "$ETC" "$SICHERUNG"
chown geschenk:geschenk /opt/geschenk/releases "$DATEN"
chmod 750 "$DATEN"
chmod 700 "$SICHERUNG"
chown root:geschenk "$ETC"
chmod 750 "$ETC"

if [ ! -f "$ENV_DATEI" ]; then
  schritt "Einstellungen schreiben ($ENV_DATEI)"
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
  {
    echo "# Einstellungen der Geschenk-App. SESSION_SECRET nie ändern (sonst werden alle Kunden-Links ungültig)."
    echo "SESSION_SECRET=$SECRET"
    echo "GESCHENK_BASE_URL=https://$DOMAIN"
    echo "GESCHENK_HTTPS=1"
    echo "GESCHENK_2FA=an"
    echo "GESCHENK_DATA_DIR=$DATEN"
    echo 'MAIL_FROM="AVEYO <kontakt@aveyo.de>"'
    case "$MAILART" in
      1) echo "SMTP_HOST=smtp-relay.gmail.com"; echo "SMTP_PORT=587" ;;
      2) echo "SMTP_HOST=smtp.gmail.com"; echo "SMTP_PORT=587"; echo "SMTP_USER=$SMTP_USER"; echo "SMTP_PASS=$SMTP_PASS" ;;
      *) echo "# SMTP_HOST=smtp-relay.gmail.com"; echo "# SMTP_PORT=587" ;;
    esac
    echo "# Google-Kalender: Schlüssel nach $ETC/google-dienstkonto.json legen und Zeile aktivieren"
    echo "# GOOGLE_SERVICE_ACCOUNT_FILE=$ETC/google-dienstkonto.json"
  } > "$ENV_DATEI"
else
  echo "Einstellungen vorhanden, bleiben unverändert: $ENV_DATEI"
fi
chown root:geschenk "$ENV_DATEI"
chmod 640 "$ENV_DATEI"
DOMAIN=$(sed -n 's#^GESCHENK_BASE_URL=https\?://##p' "$ENV_DATEI")

schritt "Werkzeuge installieren"
install -m 755 "$QUELLE/deploy/aktualisieren.sh" /usr/local/bin/geschenk-update
install -m 755 "$QUELLE/deploy/sicherung.sh" /usr/local/bin/geschenk-sicherung
install -m 755 "$QUELLE/deploy/admin.sh" /usr/local/bin/geschenk-admin
install -m 644 "$QUELLE/deploy/geschenk.service" /etc/systemd/system/geschenk.service
echo '15 3 * * * root /usr/local/bin/geschenk-sicherung >/dev/null' > /etc/cron.d/geschenk-sicherung
systemctl daemon-reload
systemctl enable geschenk >/dev/null

schritt "Webserver (Caddy, HTTPS automatisch)"
sed "s#__DOMAIN__#$DOMAIN#g" "$QUELLE/deploy/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
systemctl enable caddy >/dev/null
systemctl reload caddy || systemctl restart caddy

schritt "App bauen und starten"
/usr/local/bin/geschenk-update --ohne-pull

schritt "Geschenke, Nachrichtenvorlagen und Anlässe anlegen (ohne Demo-Daten)"
(cd /opt/geschenk/aktuell && runuser -u geschenk -- node --experimental-strip-types --no-warnings scripts/seed.ts --produktiv)

if ! runuser -u geschenk -- sqlite3 "$DATEN/geschenk.db" 'SELECT 1 FROM berater LIMIT 1' | grep -q 1; then
  schritt "Ersten Berater-Zugang anlegen"
  read -rp "Name (z. B. Adrian): " NAME
  read -rp "E-Mail: " MAIL
  while :; do
    read -rsp "Passwort (mind. 12 Zeichen, Eingabe unsichtbar): " PW; echo
    /usr/local/bin/geschenk-admin "$NAME" "$MAIL" "$PW" && break
  done
fi

# ---------- Prüfen ----------
schritt "Prüfung"
IP4=$(ip -4 route get 1.1.1.1 | awk '{for (i = 1; i < NF; i++) if ($i == "src") print $(i + 1)}')
DNS4=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)
if [ -n "$IP4" ] && [ "$DNS4" = "$IP4" ]; then
  echo "DNS stimmt: $DOMAIN → $IP4"
else
  hinweis "DNS: $DOMAIN zeigt auf „${DNS4:-nichts}“, der Server hat $IP4. A-Eintrag setzen (ANLEITUNG.md) – Caddy holt das Zertifikat automatisch, sobald es stimmt."
fi
systemctl is-active --quiet geschenk && echo "App läuft." || hinweis "App läuft nicht: journalctl -u geschenk -n 50"

cat <<EOF

Fertig.
  Admin:          https://$DOMAIN/admin   (2FA wird beim ersten Login eingerichtet)
  Server-IP:      $IP4   (für Google SMTP-Relay freigeben)
  Update:         geschenk-update
  Zugang/Passwort: geschenk-admin "Name" mail@aveyo.de "passwort"
  Sicherung:      täglich 03:15 nach $SICHERUNG (zusätzlich Hetzner-Backups aktivieren)
  Einstellungen:  $ENV_DATEI  (danach: systemctl restart geschenk)
  Protokoll:      journalctl -u geschenk -f
EOF
