#!/bin/sh
set -e

npm install --no-audit --no-fund
# SeaweedFS does not create buckets on upload. Wait until S3 answers, then create the bucket
# (an already existing bucket returns 409, which is fine).
until curl -s -o /dev/null -X PUT "$S3_ENDPOINT/$S3_BUCKET"; do sleep 2; done

npx medusa db:migrate
npx medusa exec ./src/scripts/seed.ts
npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" || echo "Admin user already exists"

exec npx medusa develop
