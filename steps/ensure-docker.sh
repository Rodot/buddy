#!/bin/bash

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
