param(
  [switch]$InitDb
)

$ErrorActionPreference = "Stop"

function Test-Command {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "[dev-env] missing command: $Name"
  }
}

function Wait-MySqlHealthy {
  param(
    [string]$ContainerName = "enterprise-blog-mysql-dev",
    [int]$Retries = 30
  )

  for ($i = 1; $i -le $Retries; $i++) {
    $status = ""
    try {
      $status = (docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}" $ContainerName 2>$null).Trim()
    } catch {
      $status = "unavailable"
    }
    if ($status -eq "healthy") {
      Write-Host "[dev-env] mysql is healthy"
      return
    }
    Write-Host "[dev-env] waiting mysql health ($i/$Retries): $status"
    Start-Sleep -Seconds 2
  }

  throw "[dev-env] mysql health check timeout"
}

Test-Command "docker"
Test-Command "pnpm"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "apps/api/.env")) {
  Copy-Item "apps/api/.env.example" "apps/api/.env"
  Write-Host "[dev-env] created apps/api/.env from .env.example"
}

Write-Host "[dev-env] starting mysql + minio + redis containers"
docker compose up -d mysql minio redis | Out-Null

if ($InitDb) {
  Wait-MySqlHealthy
  Write-Host "[dev-env] running database init (migrate + seed)"
  pnpm db:init
}

Write-Host "[dev-env] running lint"
pnpm lint

Write-Host "[dev-env] starting local nest + web"
Write-Host "[dev-env] web: http://localhost:5173"
Write-Host "[dev-env] api: http://localhost:3000/api/v1"
pnpm dev
