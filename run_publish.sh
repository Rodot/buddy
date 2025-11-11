#!/bin/bash
set -e
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_PATH" || exit

source ./steps/common.sh

REGISTRY="ghcr.io"
IMAGE_NAME="rodot/buddy"
TAG="latest"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"
OWNER="rodot"
PACKAGE="buddy"

cleanup_untagged_images() {
	gh api "/users/${OWNER}/packages/container/${PACKAGE}/versions" \
		--jq '.[] | select(.metadata.container.tags | length == 0) | .id' |
		xargs -I {} gh api --method DELETE "/users/${OWNER}/packages/container/${PACKAGE}/versions/{}" || true
}

publish_image() {
	run_timed "Check Git Status" "check_git_status"

	run_timed "Quality Checks & Build" "./run_quality.sh"

	run_timed "Push to Git" "git push"

	run_timed "Tag Image" "docker tag buddy:test ${FULL_IMAGE}"

	run_timed "Push Image" "docker push ${FULL_IMAGE}"

	run_timed "Deploy to smol" "ssh smol 'cd docker && docker compose up -d'"

	run_timed "Cleanup Untagged Images" "cleanup_untagged_images"
}

run_timed "Publish" "publish_image"
