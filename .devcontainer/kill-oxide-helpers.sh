#!/usr/bin/env bash
# Works around a confirmed WebStorm bug where the Tailwind CSS plugin's
# oxide-helper.js process spawns runaway copies of itself inside the
# devcontainer instead of reusing one. Runs for the lifetime of the
# container (started from devcontainer.json's postStartCommand).
set -uo pipefail

PATTERN="tailwindcss/server/bin/oxide-helper.js"
INTERVAL_SECONDS=300
# WebStorm normally keeps one of these alive; only treat it as the bug
# (and log it) once the count is clearly runaway.
RUNAWAY_THRESHOLD=10
LOG_FILE="/tmp/kill-oxide-helpers.log"

while true; do
  count=$(pgrep -cf "$PATTERN" || true)

  if [ "$count" -gt "$RUNAWAY_THRESHOLD" ]; then
    pkill -f "$PATTERN" || true
    echo "$(date -Iseconds) killed $count rogue oxide-helper processes" >>"$LOG_FILE"
  fi

  sleep "$INTERVAL_SECONDS"
done
