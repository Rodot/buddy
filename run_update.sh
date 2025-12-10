#!/bin/bash
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_PATH" || exit
source ./steps/common.sh
set -e

npx npm-check-updates -u && npm install
