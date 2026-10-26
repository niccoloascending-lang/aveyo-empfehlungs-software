#!/usr/bin/env bash
# Berater-Zugang anlegen oder Passwort zurücksetzen (setzt auch 2FA zurück). Als root:
#   geschenk-admin "Adrian" adrian@aveyo.de          (fragt das Passwort unsichtbar ab)
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Bitte als root ausführen."; exit 1; }
[ $# -ge 2 ] || { echo 'Aufruf: geschenk-admin "Name" mail@aveyo.de'; exit 1; }
PW=${3:-}
if [ -z "$PW" ]; then
  read -rsp "Passwort für $2 (mind. 12 Zeichen): " PW; echo
fi
cd /opt/geschenk/aktuell
exec runuser -u geschenk -- node --experimental-strip-types --no-warnings scripts/admin-add.ts "$1" "$2" "$PW"
