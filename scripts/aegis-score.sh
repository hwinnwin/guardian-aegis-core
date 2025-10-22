#!/usr/bin/env bash
set -euo pipefail

LOG_PATH="${1:-}"
if [[ -z "$LOG_PATH" ]]; then
  LOG_PATH="$(ls -1t .aegis_audit/final_audit_*.log 2>/dev/null | head -n1 || true)"
fi

if [[ -z "$LOG_PATH" || ! -f "$LOG_PATH" ]]; then
  echo "SCORE: 0.00%"
  exit 0
fi

if grep -qE '^SCORE:\s*[0-9.]+%$' "$LOG_PATH"; then
  grep -E '^SCORE:\s*[0-9.]+%$' "$LOG_PATH" | tail -n1
  exit 0
fi

PASS=$(grep -Eo 'PASS:\s*[0-9]+' "$LOG_PATH" | awk '{print $2}' | tail -n1 2>/dev/null || echo 0)
WARN=$(grep -Eo 'WARN:\s*[0-9]+' "$LOG_PATH" | awk '{print $2}' | tail -n1 2>/dev/null || echo 0)
FAIL=$(grep -Eo 'FAIL:\s*[0-9]+' "$LOG_PATH" | awk '{print $2}' | tail -n1 2>/dev/null || echo 1)

score="0.00"
if [[ "$FAIL" -eq 0 && "$WARN" -eq 0 ]]; then
  score="99.99"
elif [[ "$FAIL" -eq 0 && "$WARN" -gt 0 ]]; then
  score="99.90"
else
  score="95.00"
fi

printf 'SCORE: %s%%\n' "$score"
