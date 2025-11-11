#!/bin/bash
set -e
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_PATH" || exit

source ./steps/common.sh

REGISTRY="ghcr.io"
IMAGE_NAME="rodot/buddy"
TAG="latest"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

publish_image() {
	run_timed "Check Git Status" "check_git_status"

	run_timed "Quality Checks & Build" "./run_quality.sh"

	run_timed "Push to Git" "git push"

	run_timed "Tag Image" "docker tag buddy:test ${FULL_IMAGE}"

	run_timed "Push Image" "docker push ${FULL_IMAGE}"

	run_timed "Deploy to smol" "ssh smol 'cd docker && docker compose up -d'"
}

run_timed "Publish" "publish_image"
