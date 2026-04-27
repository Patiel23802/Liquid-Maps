#!/usr/bin/env bash
# Run from the backend folder: bash scripts/friend-setup-db.sh
# Requires: Node 20+, PostgreSQL reachable via DATABASE_URL in .env

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Create backend/.env from .env.example and set DATABASE_URL (and JWT secrets) first."
  exit 1
fi

npm install
npm run db:generate
npm run db:setup

echo "Done. Tables + seed data are in the database named in DATABASE_URL."
