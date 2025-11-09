#!/bin/bash
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_PATH" || exit

source ./steps/common.sh

run_timed "Cleanup" "rm -rf output dist"

run_timed "Brew install" "brew bundle --quiet"

run_timed "Npm install" "npm install 2>&1"

run_timed "Shfmt" "find . -name '*.sh' -type f -exec shfmt -l -w {} +"

run_timed "Shellcheck" "find . -name '*.sh' -type f -exec shellcheck --severity=warning {} +"

# run_timed "Prettier" "npm run format 2>&1"

# run_timed "Markdownlint" "npm run lint:md 2>&1"

run_timed "TypeScript" "npm run typecheck 2>&1"

# run_timed "ESLint" "npm run lint 2>&1"

run_timed "Build" "npm run build 2>&1"

# run_timed "Playwright Install Browsers" "npx --yes playwright install chromium 2>&1"

# fuser -k 4321/tcp 2>/dev/null || true
# npm run start >/dev/null 2>&1 &

# run_timed "Playwright Tests" "npm run test 2>&1"

# fuser -k 4321/tcp 2>/dev/null || true

echo "✅✅✅ QUALITY PASSED"
