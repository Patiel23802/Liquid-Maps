# Run from the backend folder in PowerShell:
#   cd path\to\repo\backend
#   powershell -ExecutionPolicy Bypass -File .\scripts\friend-setup-db.ps1
#
# Requires: Node 20+, PostgreSQL running, backend\.env with DATABASE_URL + JWT secrets.

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".env")) {
    Write-Error "Create backend\.env from .env.example and set DATABASE_URL (and JWT secrets) first."
}

npm install
npm run db:generate
npm run db:setup

Write-Host "Done. Tables + seed data are in the database named in DATABASE_URL."
