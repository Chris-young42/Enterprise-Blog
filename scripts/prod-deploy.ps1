param(
  [switch]$NoBuild
)

$ErrorActionPreference = "Stop"

function Test-Command {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "[prod] missing command: $Name"
  }
}

Test-Command "docker"

$root = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $root "docker-compose.prod.yml"
$envFile = Join-Path $root ".env.prod"

if (-not (Test-Path $envFile)) {
  throw "[prod] missing .env.prod, please copy .env.prod.example and fill secrets"
}

Set-Location $root

Write-Host "[prod] validating compose"
docker compose --env-file $envFile -f $composeFile config | Out-Null

if (-not $NoBuild) {
  Write-Host "[prod] building images"
  docker compose --env-file $envFile -f $composeFile build
}

Write-Host "[prod] starting services"
docker compose --env-file $envFile -f $composeFile up -d

Write-Host "[prod] done"
docker compose --env-file $envFile -f $composeFile ps
