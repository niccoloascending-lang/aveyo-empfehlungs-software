# AVEYO Geschenk-Empfehlung – Hinweise für Claude Code

Eigenständige App (Port 3200, eigene DB `data/geschenk.db`). Gleicher Stil wie Immo-Match (eigenes Repository `immo-crm`); Texte und Kommentare auf Deutsch.
Ausführlich: `README.md`.

## Harte Regeln
1. **Die App versendet nie selbst Nachrichten an Freunde.** Teilen nur über `wa.me`, `t.me/share`, `mailto:`, Zwischenablage, `navigator.share`. Keine Eingabefelder für Kontaktdaten Dritter.
2. **E-Mails an Freunde nur nach eigener Eingabe + Double-Opt-in** (`anfragen.ts`). Bestätigen nur per POST (Knopf), nicht per GET.
3. **Empfehler sehen nur Zahlen;** Namen nur mit Einwilligung `empfehler_info` (nicht vorausgewählt, `aktivAngehakt` prüft streng auf `true`).
4. **Keine Texte für Kunden/Freunde hart codieren:** neuer Text → Schlüssel in `src/lib/texte.ts` (Du/Sie, ggf. `rechtlich: true`), Abruf über `texte([...])`/`t()`.
5. **Keine Geldprämien an Freunde**, kein Bargeld; Dankeschön an Empfehler nur über den A/B-Test (Spende A / Gutschein B, `zusagen.ts`). Keine Renditeversprechen, keine Superlative (Test in `tests/texte.test.ts`).
6. Tracking ohne Cookies und ohne IP; Link-Vorschau-Bots zählen nicht (`istVorschauBot`).
7. Schema nur abwärtskompatibel (`CREATE TABLE IF NOT EXISTS`, `addColumnIfMissing`).
8. Logik in reine Dateien (nur relative Importe mit `.ts`-Endung, keine `@/`-Importe in `src/lib`) + Test. Vor jedem Push: `npx tsc --noEmit`, `npm test`, `npm run build`, möglichst `npm run test:e2e`.
9. Google-Kalender (`kalender.ts`): nur frei/belegt lesen, Termine erst nach Double-Opt-in eintragen. Dienstkonto-Schlüssel nie ins Repo.
10. Keine echten Kundendaten in Repo, Logs, Tests, Screenshots. Beispieldaten nur mit `example.org`.
