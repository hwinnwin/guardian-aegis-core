#!/usr/bin/env bash
set -euo pipefail

run5() {
  local log="$1"; shift; : >"$log"
  ( "$@" ) > >(tee -a "$log") 2> >(tee -a "$log" >&2) &
  local pid=$!
  for i in $(seq 1 300); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done
  if kill -0 "$pid" 2>/dev/null; then
    echo "::error::Step exceeded 5 minutes"; kill -9 "$pid" || true; exit 124
  fi
  wait "$pid" || {
    echo "---- LAST 30 LINES ----"; tail -n 30 "$log" || true; exit 1;
  }
}

hash_file() {
  (command -v shasum >/dev/null && shasum -a 256 "$1" || sha256sum "$1") | awk '{print $1}'
}
