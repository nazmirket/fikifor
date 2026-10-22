#!/bin/sh
set -eu

repo_root=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
env_file=${1:-"$repo_root/deploy/.env"}
compose_file="$repo_root/deploy/compose.yml"

if [ -n "${CONTAINER_ENGINE:-}" ]; then
  engine=$CONTAINER_ENGINE
elif command -v podman >/dev/null 2>&1; then
  engine=podman
else
  engine=docker
fi

if ! command -v "$engine" >/dev/null 2>&1; then
  echo 'Install Docker or Podman, or set CONTAINER_ENGINE.' >&2
  exit 1
fi

if ! images=$("$engine" compose --env-file "$env_file" --file "$compose_file" config --images 2>/dev/null); then
  echo 'Deployment Compose configuration failed. Check the environment file and container engine.' >&2
  exit 1
fi

image_count=$(printf '%s\n' "$images" | wc -l | tr -d ' ')
pinned_count=$(printf '%s\n' "$images" | grep -Ec '^.+@sha256:[[:xdigit:]]{64}$' || true)
if [ "$image_count" -ne 6 ] || [ "$pinned_count" -ne 6 ]; then
  echo 'All six deployment services need digest-pinned image references.' >&2
  exit 1
fi

echo 'Deployment Compose configuration and all six image digests are valid.'
