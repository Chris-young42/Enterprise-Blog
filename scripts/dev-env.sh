#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INIT_DB=0

if [[ "${1:-}" == "--init-db" ]]; then
  INIT_DB=1
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[dev-env] missing command: $1" >&2
    exit 1
  fi
}

wait_mysql_healthy() {
  local container="enterprise-blog-mysql-dev"
  local retries=30
  local i status

  for ((i=1; i<=retries; i++)); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$container" 2>/dev/null || true)"
    if [[ "$status" == "healthy" ]]; then
      echo "[dev-env] mysql is healthy"
      return 0
    fi
    echo "[dev-env] waiting mysql health ($i/$retries): ${status:-unavailable}"
    sleep 2
  done

  echo "[dev-env] mysql health check timeout" >&2
  exit 1
}

require_cmd docker
require_cmd pnpm

cd "$ROOT_DIR"

if [[ ! -f "apps/api/.env" ]]; then
  cp "apps/api/.env.example" "apps/api/.env"
  echo "[dev-env] created apps/api/.env from .env.example"
fi

echo "[dev-env] starting mysql + minio + redis containers"
docker compose up -d mysql minio redis

if [[ "$INIT_DB" -eq 1 ]]; then
  wait_mysql_healthy
  echo "[dev-env] running database init (migrate + seed)"
  pnpm db:init
fi

echo "[dev-env] running lint"
pnpm lint

echo "[dev-env] starting local nest + web"
echo "[dev-env] web: http://localhost:5173"
echo "[dev-env] api: http://localhost:3000/api/v1"
pnpm dev
