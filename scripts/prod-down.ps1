$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $root "docker-compose.prod.yml"
$envFile = Join-Path $root ".env.prod"

if (-not (Test-Path $envFile)) {
  throw "[prod] missing .env.prod"
}

Set-Location $root
docker compose --env-file $envFile -f $composeFile down
