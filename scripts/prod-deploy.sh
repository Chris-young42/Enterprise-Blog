#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.prod.yml"
ENV_FILE="${ROOT_DIR}/.env.prod"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[prod] missing command: $1" >&2
    exit 1
  fi
}

require_cmd docker

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[prod] missing ${ENV_FILE}" >&2
  echo "[prod] copy .env.prod.example -> .env.prod and fill secrets first" >&2
  exit 1
fi

cd "${ROOT_DIR}"

echo "[prod] validating compose"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config >/dev/null

echo "[prod] building images"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build

echo "[prod] starting services"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d

echo "[prod] done"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps
