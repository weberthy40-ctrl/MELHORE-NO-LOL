#!/usr/bin/env bash
# Run from the repository root; no installation or product-data cleanup.
set -euo pipefail
# Ignore local subset/remote-CDP overrides: CI owns its full suite and profile.
unset QA_MENUS_ONLY QA_GAMEPLAY_CASE CDP_URL
artifacts="${QA_ARTIFACT_DIR:-${RUNNER_TEMP:-/tmp}/rift-browser-artifacts}"
mkdir -p "$artifacts"
export QA_ARTIFACT_DIR="$artifacts"
export CDP_TIMEOUT_MS=45000
profile=$(mktemp -d "${RUNNER_TEMP:-/tmp}/rift-chrome.XXXXXX")
server_pid=''
browser_pid=''
cleanup() {
  if [[ -n "$browser_pid" ]]; then kill "$browser_pid" 2>/dev/null || true; wait "$browser_pid" 2>/dev/null || true; fi
  if [[ -n "$server_pid" ]]; then kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; fi
  rm -rf -- "$profile"
}
trap cleanup EXIT
chrome="${CHROME_BIN:-google-chrome}"
node --version
"$chrome" --version
# Start Vite directly so the PID belongs to the server, not an npm wrapper.
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort >"$artifacts/vite.log" 2>&1 &
server_pid=$!
"$chrome" --headless --no-sandbox --disable-dev-shm-usage --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir="$profile" about:blank >"$artifacts/chrome.log" 2>&1 &
browser_pid=$!
for endpoint in http://127.0.0.1:5173/ http://127.0.0.1:9222/json/version; do
  ready=false
  for attempt in {1..60}; do
    kill -0 "$server_pid"
    kill -0 "$browser_pid"
    if curl --fail --silent --max-time 2 "$endpoint" >/dev/null; then ready=true; break; fi
    sleep 1
  done
  if [[ "$ready" != true ]]; then echo "Readiness failed: $endpoint" >&2; exit 1; fi
done
# Only fullscreen is excluded; all other existing assertions remain enabled.
export QA_SKIP_FULLSCREEN=1
summary="${GITHUB_STEP_SUMMARY:-$artifacts/summary.md}"
echo 'Fullscreen: SKIPPED explicitly in headless; manual acceptance remains open.' >>"$summary"
for suite in browser storage dodge gameplay replay profile; do
  if timeout 360s npm run "test:$suite" 2>&1 | tee "$artifacts/$suite.log"; then
    echo "test:$suite: PASSED (gameplay excludes fullscreen)" >>"$summary"
  else
    result=$?
    echo "test:$suite: FAILED (exit $result); subsequent suites NOT RUN" >>"$summary"
    exit "$result"
  fi
done
