#!/usr/bin/env bash
# Smoke test for the PNEUMOTrack backend.
# Usage: ./scripts/smoke.sh [base_url] [sample_audio]
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8000}"
SAMPLE="${2:-}"

echo "health:"
curl -fsS "$BASE_URL/health"
echo

if [ -z "$SAMPLE" ]; then
  echo "no sample audio given; skipping /predict"
  exit 0
fi

echo "predict ($SAMPLE):"
curl -fsS -X POST "$BASE_URL/predict" -F "audio=@$SAMPLE" | head -c 600
echo
