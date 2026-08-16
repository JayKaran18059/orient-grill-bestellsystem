#!/usr/bin/env bash
#
# Deployt "webapp" (die Website, Projekt orient-grill-bestellung) oder
# "essence" (das Backend mit der Speisekarte, Projekt orient-grill-daten)
# auf Vercel — ohne dass man von Hand zwischen den zwei Projekten
# umlinken muss.
#
# Warum das nötig ist: `.vercel/project.json` merkt sich immer nur ein
# Projekt gleichzeitig. Deployt man ohne umzulinken, überschreibt man
# versehentlich das falsche Projekt — das ist in diesem Repo schon
# passiert. Dieses Skript verlinkt vor dem Deploy zum richtigen
# Ziel, deployt, und stellt danach die vorherige Verlinkung wieder her,
# damit `vercel dev` & Co. hinterher weiter auf das gewohnte Projekt
# zeigen.
#
# Aufruf:
#   ./deploy.sh webapp
#   ./deploy.sh essence

set -euo pipefail
cd "$(dirname "$0")"

ziel="${1:-}"
if [[ "$ziel" != "webapp" && "$ziel" != "essence" ]]; then
  echo "Aufruf: ./deploy.sh webapp|essence" >&2
  exit 1
fi

if [[ "$ziel" == "webapp" ]]; then
  projekt="orient-grill-bestellung"
  konfig="vercel.webapp.json"
else
  projekt="orient-grill-daten"
  konfig="vercel.essence.json"
fi

# Vorherige Verlinkung merken, um sie am Ende wiederherzustellen.
vorheriges_projekt=""
if [[ -f .vercel/project.json ]]; then
  vorheriges_projekt=$(node -pe "require('./.vercel/project.json').projectName")
fi

aufraeumen() {
  if [[ -n "$vorheriges_projekt" && "$vorheriges_projekt" != "$projekt" ]]; then
    echo "→ Verlinke zurück zu $vorheriges_projekt …"
    rm -rf .vercel
    vercel link --yes --project "$vorheriges_projekt" >/dev/null
  fi
}
trap aufraeumen EXIT

if [[ "$vorheriges_projekt" != "$projekt" ]]; then
  echo "→ Verlinke zu $projekt …"
  rm -rf .vercel
  vercel link --yes --project "$projekt" >/dev/null
fi

echo "→ Deploye $projekt …"
vercel deploy --prod --local-config "$konfig" --yes
