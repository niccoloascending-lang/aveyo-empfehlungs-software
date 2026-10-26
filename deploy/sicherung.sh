#!/usr/bin/env bash
# Tägliche Sicherung (Cron 03:15): Datenbank als konsistente Kopie, hochgeladene Dateien gespiegelt.
# Datenbank-Sicherungen bleiben 30 Tage. Zusätzlich Hetzner-Backups aktivieren (Kopie außerhalb des Servers).
set -euo pipefail
DATEN=/var/lib/geschenk
ZIEL=/var/backups/geschenk
TAGE=30

mkdir -p "$ZIEL/dateien"
chmod 700 "$ZIEL"
[ -f "$DATEN/geschenk.db" ] || { echo "Noch keine Datenbank."; exit 0; }
DATEI="$ZIEL/geschenk-$(date +%F-%H%M).db"
sqlite3 "$DATEN/geschenk.db" ".backup '$DATEI'"
gzip -f "$DATEI"
# Uploads spiegeln (gelöschte Dateien verschwinden auch aus der Sicherung)
[ -d "$DATEN/dateien" ] && rsync -a --delete "$DATEN/dateien/" "$ZIEL/dateien/"
find "$ZIEL" -maxdepth 1 -name 'geschenk-*.db.gz' -mtime +"$TAGE" -delete
echo "Gesichert: $DATEI.gz"
