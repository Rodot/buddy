#!/bin/bash
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_PATH" || exit

source ./steps/common.sh

run_quality_checks() {
	run_timed "Cleanup" "rm -rf output dist"

	run_timed "Brew install" "brew bundle --quiet"

	run_timed "Npm install" "npm install 2>&1"

	run_timed "Shfmt" "find . -name '*.sh' -type f -exec shfmt -l -w {} +"

	run_timed "Shellcheck" "find . -name '*.sh' -type f -exec shellcheck --severity=warning {} +"

	run_timed "Prettier" "npm run format 2>&1"

	run_timed "Markdownlint" "npm run lint:md 2>&1"

	run_timed "TypeScript" "npm run typecheck 2>&1"

	run_timed "ESLint" "npm run lint 2>&1"

	run_timed "React Compiler Check" "./steps/check-react-compiler.sh"

	run_timed "Docker Build" "docker build -t buddy:test . 2>&1"

	run_timed "Playwright Install" "npx --yes playwright install chromium 2>&1"

	docker rm -f buddy-test 2>/dev/null || true
	docker run -d --name buddy-test -p 4321:4321 --env-file .env buddy:test >/dev/null 2>&1

	run_timed "Playwright Test" "npm run test 2>&1"

	echo ""
	echo "👉️ Running at http://localhost:4321"
}

run_timed "Quality Checks" "run_quality_checks"
