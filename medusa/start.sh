#!/bin/sh
set -e

npm install --no-audit --no-fund
npx medusa db:migrate
npx medusa exec ./src/scripts/seed.ts
npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" || echo "Admin user already exists"

exec npx medusa develop
