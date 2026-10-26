#!/usr/bin/env bash
# Update der Geschenk-App (als root): neuen Stand holen, in eigenem Ordner bauen und testen,
# erst dann umschalten. Antwortet die App danach nicht, wird automatisch auf die vorige Version zurückgeschaltet.
#
#   geschenk-update               neuesten Stand von GitHub (main) einspielen
#   geschenk-update --zurueck     auf die vorige Version zurückschalten
set -euo pipefail

# Alles steht in main(): Bash liest die Funktion vollständig ein, bevor sie läuft –
# so darf sich das Skript während des Updates selbst ersetzen.
main() {
BASIS=/opt/geschenk
QUELLE=$BASIS/quelle
RELEASES=$BASIS/releases
AKTUELL=$BASIS/aktuell
BEHALTEN=3

[ "$(id -u)" = 0 ] || { echo "Bitte als root ausführen (sudo geschenk-update)."; exit 1; }
exec 9>/run/geschenk-update.lock
flock -n 9 || { echo "Es läuft bereits ein Update."; exit 1; }

laeuft() {
  for _ in $(seq 1 45); do
    curl -fs -o /dev/null http://127.0.0.1:3200/admin/login && return 0
    sleep 1
  done
  return 1
}
umschalten() {
  ln -sfn "$1" "$AKTUELL.neu" && mv -Tf "$AKTUELL.neu" "$AKTUELL"
  systemctl restart geschenk
}

ALT=$(readlink -f "$AKTUELL" 2>/dev/null || true)

if [ "${1:-}" = "--zurueck" ]; then
  # die Version direkt vor der laufenden
  VORIG=$(ls -1d "$RELEASES"/*/ 2>/dev/null | sed 's#/$##' | sort | awk -v alt="$ALT" '$0 == alt { print vorher; exit } { vorher = $0 }')
  [ -n "$VORIG" ] || { echo "Keine vorige Version vorhanden."; exit 1; }
  echo "Schalte zurück auf $(basename "$VORIG") …"
  umschalten "$VORIG"
  laeuft && echo "Läuft wieder." || { echo "App antwortet nicht: journalctl -u geschenk -n 50"; exit 1; }
  exit 0
fi

if [ "${1:-}" != "--ohne-pull" ]; then
  echo "== Neuen Stand holen"
  git -C "$QUELLE" fetch -q origin main
  git -C "$QUELLE" reset -q --hard origin/main
fi
# Werkzeuge und Dienst aus dem Repository aktuell halten
install -m 755 "$QUELLE/deploy/aktualisieren.sh" /usr/local/bin/geschenk-update
install -m 755 "$QUELLE/deploy/sicherung.sh" /usr/local/bin/geschenk-sicherung
install -m 755 "$QUELLE/deploy/admin.sh" /usr/local/bin/geschenk-admin
if ! cmp -s "$QUELLE/deploy/geschenk.service" /etc/systemd/system/geschenk.service; then
  install -m 644 "$QUELLE/deploy/geschenk.service" /etc/systemd/system/geschenk.service
  systemctl daemon-reload
fi

STAND=$(git -C "$QUELLE" rev-parse --short HEAD)
if [ -n "$ALT" ] && [ "$(basename "$ALT" | sed 's/.*-//')" = "$STAND" ]; then
  echo "Bereits auf dem neuesten Stand ($STAND)."
  exit 0
fi
# Schon einmal fertig gebaut (z. B. nach --zurueck)? Dann nur umschalten.
FERTIG=$(ls -1d "$RELEASES"/*-"$STAND"/ 2>/dev/null | sed 's#/$##' | sort | tail -1 || true)
if [ -n "$FERTIG" ] && [ -f "$FERTIG/.next/BUILD_ID" ]; then
  echo "== Version $STAND ist schon gebaut – schalte um"
  umschalten "$FERTIG"
  laeuft && { echo "Version $STAND läuft."; exit 0; }
  echo "!! Antwortet nicht – zurück auf $(basename "$ALT")."
  umschalten "$ALT"
  exit 1
fi
NEU="$RELEASES/$(date +%Y%m%d-%H%M%S)-$STAND"
echo "== Baue und teste Version $STAND (ca. 1–2 Minuten)"
mkdir -p "$NEU" /var/cache/geschenk-npm
git -C "$QUELLE" archive HEAD | tar -x -C "$NEU"
ln -s /etc/geschenk/geschenk.env "$NEU/.env.local"
chown -R geschenk:geschenk "$NEU" /var/cache/geschenk-npm
LOG=/tmp/geschenk-build.log
rm -f "$LOG"

if ! runuser -u geschenk -- env HOME=/var/cache/geschenk-npm npm_config_cache=/var/cache/geschenk-npm NEXT_TELEMETRY_DISABLED=1 \
  bash -c "cd '$NEU' && npm ci --no-audit --no-fund && npm test && npm run build" >"$LOG" 2>&1; then
  echo "!! Installation, Tests oder Build fehlgeschlagen – die laufende Version bleibt unverändert."
  echo "   Auszug aus $LOG:"
  grep -E "error|Error|not ok|fail" "$LOG" | grep -v "^# fail 0" | head -n 20 || tail -n 20 "$LOG"
  rm -rf "$NEU"
  exit 1
fi
rm -rf "$NEU/data"   # von den Tests angelegt; echte Daten liegen in /var/lib/geschenk

echo "== Sicherung vor dem Umschalten"
/usr/local/bin/geschenk-sicherung || echo "(Sicherung übersprungen)"

echo "== Umschalten"
umschalten "$NEU"
if laeuft; then
  echo "Version $STAND läuft."
else
  echo "!! Neue Version antwortet nicht."
  if [ -n "$ALT" ] && [ -d "$ALT" ]; then
    echo "Schalte zurück auf $(basename "$ALT")."
    umschalten "$ALT"
    laeuft && echo "Vorige Version läuft wieder." || echo "Auch die vorige Version antwortet nicht: journalctl -u geschenk -n 50"
    rm -rf "$NEU"
  fi
  exit 1
fi

# Alte Versionen aufräumen (aktuelle + die letzten Vorgänger bleiben)
ls -1d "$RELEASES"/*/ | sed 's#/$##' | sort | head -n -"$BEHALTEN" | while read -r d; do
  [ "$d" = "$(readlink -f "$AKTUELL")" ] || rm -rf "$d"
done
}

main "$@"
exit $?
