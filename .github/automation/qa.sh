#!/usr/bin/env bash
# Trusted controller. Executed as a separate unprivileged user with an empty environment.
set -euo pipefail
cd "$1"
out="$2"
mkdir -p "$out"
export QA_ARTIFACT_DIR="$out/browser"
printf 'Node: '; node --version
# Manifests/lockfile are immutable across generated patches. No package lifecycle hooks.
npm ci --ignore-scripts --no-fund
npm test
npm run lint
npm run build
npm audit
bash scripts/ci-browser.sh
# The helper closes its own dev/CDP processes. Use fresh browser data for production smoke.
server='';browser='';profile=$(mktemp -d)
cleanup(){ if [[ -n "$browser" ]]; then kill "$browser" 2>/dev/null || true; fi; if [[ -n "$server" ]]; then kill "$server" 2>/dev/null || true; fi; rm -rf -- "$profile"; }
trap cleanup EXIT
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort >"$out/preview.log" 2>&1 & server=$!
"${CHROME_BIN:-google-chrome}" --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir="$profile" about:blank >"$out/production-chrome.log" 2>&1 & browser=$!
for endpoint in http://127.0.0.1:4173/ http://127.0.0.1:9222/json/version; do
 ready=false
 for attempt in {1..60}; do
  kill -0 "$server";kill -0 "$browser"
  if curl --fail --silent --max-time 2 "$endpoint" >/dev/null;then ready=true;break;fi
  sleep 1
 done
 [[ "$ready" == true ]] || exit 1
done
QA_ARTIFACT_DIR="$out/production" CDP_TIMEOUT_MS=45000 npm run test:browser -- http://127.0.0.1:4173/
printf 'APROVADA: unit/lint/build/audit/browser6/production. Fullscreen EXCLUIDO; hardware NAO EXECUTADO.\n' >"$out/result.txt"
