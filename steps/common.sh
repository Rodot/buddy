#!/bin/bash

check_git_status() {
	if [[ -n $(git status --porcelain) ]]; then
		echo "Error: There are uncommitted changes in the repository. Please do atomic commits of what should be kept, and discard the rest, before publishing."
		git status
		exit 1
	fi
	git push
}

ensure_docker_running() {
	if ! docker info >/dev/null 2>&1; then
		echo "⚠️  Docker daemon not running, starting Docker Desktop..."
		systemctl --user start docker-desktop 2>/dev/null || {
			echo "❌ Failed to start Docker Desktop via systemctl"
			echo "Please start Docker Desktop manually and try again"
			exit 1
		}

		echo "⌛️ Waiting for Docker daemon to be ready..."
		for _ in {1..30}; do
			if docker info >/dev/null 2>&1; then
				echo "✅ Docker daemon is ready"
				return 0
			fi
			sleep 1
		done

		echo "❌ Docker daemon failed to start after 30 seconds"
		exit 1
	fi
}

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
