#!/usr/bin/env bash
set -euo pipefail

# Runs a load scenario with a local k6 when one is installed, and with the official
# image otherwise — Docker is already a prerequisite for the stack, so no extra
# install is needed. Scenario knobs are k6 env vars: ./scripts/k6.sh ingest.js -e RATE=200

script="${1:?usage: k6.sh <scenario.js> [k6 args...]}"
shift

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v k6 >/dev/null 2>&1; then
  exec k6 run "$@" "${root}/load/${script}"
fi

# --network host keeps localhost meaning the host's localhost; on macOS install k6
# natively or point the scenario elsewhere with -e BASE_URL=...
exec docker run --rm -i --network host \
  --volume "${root}/load:/load:ro" \
  grafana/k6:latest run "$@" "/load/${script}"
