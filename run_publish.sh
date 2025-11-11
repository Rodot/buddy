#!/bin/bash
set -e
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_PATH" || exit

source ./steps/common.sh

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

REGISTRY="ghcr.io"
IMAGE_NAME="rodot/buddy"
TAG="latest"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

publish_image() {
	run_timed "Docker Check" "ensure_docker_running"

	run_timed "Quality Checks & Build" "./run_quality.sh"

	run_timed "Tag Image" "docker tag buddy:test ${FULL_IMAGE}"

	run_timed "Push Image" "docker push ${FULL_IMAGE}"

	run_timed "Deploy to smol" "ssh smol 'cd docker && docker compose up -d'"
}

run_timed "Publish" "publish_image"
