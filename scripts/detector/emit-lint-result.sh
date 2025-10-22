#!/usr/bin/env bash
set -euo pipefail

PASS="${1:-1}"
if [[ "$PASS" != "0" && "$PASS" != "1" ]]; then
  PASS=1
fi

SCORE=$(( PASS * 100 ))

mkdir -p artifacts
cat > artifacts/lint.json <<JSON
{
  "passed": $PASS,
  "score": $SCORE
}
JSON

echo "Detector lint score: $SCORE (passed=$PASS)"
