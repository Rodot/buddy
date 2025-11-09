#!/bin/bash

run_timed() {
	local message="$1"
	local command="$2"

	echo "⌛️ $message"

	local start_time
	start_time=$(date +%s)

	eval "$command" 2>&1
	local exit_code=$?

	local end_time
	end_time=$(date +%s)
	local elapsed=$((end_time - start_time))

	local status_emoji
	status_emoji=$([[ $exit_code -eq 0 ]] && echo "✅" || echo "❌[ERROR]")
	echo "$status_emoji $message ${elapsed}s"

	[[ $exit_code -eq 0 ]] || exit 1
}
