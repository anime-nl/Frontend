#!/usr/bin/env bash
# Works around a confirmed WebStorm bug where the Tailwind CSS plugin's
# oxide-helper.js process spawns runaway copies of itself inside the
# devcontainer instead of reusing one. Runs for the lifetime of the
# container (started from devcontainer.json's postStartCommand).
#
# This enforces a hard cap by polling fast rather than periodically: a
# burst was observed going from 1 to 700+ processes within a single
# 5-minute window, which drove the container into heavy swapping. There
# is no kernel-level way to cap just this process tree from inside the
# devcontainer (cgroups' pids.max isn't writable here, and even if it
# were, it would cap the whole container, not just this one binary), so
# the cap is enforced in a tight loop instead.
set -uo pipefail

PATTERN="tailwindcss/server/bin/oxide-helper.js"
POLL_INTERVAL_SECONDS=3
# WebStorm normally keeps one of these alive; a small cap leaves room for
# that plus brief overlap during a restart, without ever letting a burst
# run away before the next poll catches it.
HARD_LIMIT=5
LOG_FILE="/tmp/kill-oxide-helpers.log"

while true; do
  count=$(pgrep -cf "$PATTERN" || true)

  if [ "$count" -gt "$HARD_LIMIT" ]; then
    pkill -f "$PATTERN" || true
    echo "$(date -Iseconds) killed $count oxide-helper processes (hard limit $HARD_LIMIT)" >>"$LOG_FILE"
  fi

  sleep "$POLL_INTERVAL_SECONDS"
done
