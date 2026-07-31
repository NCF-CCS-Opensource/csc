#!/usr/bin/env bash
set -euo pipefail

container="attendance-integration-$$"
database="attendance_test"

cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --detach --name "$container" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB="$database" \
  --publish 127.0.0.1::5432 \
  postgres:17-alpine >/dev/null

ready=false
for _ in {1..30}; do
  if docker exec "$container" pg_isready -U postgres -d "$database" >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done

if [[ "$ready" != true ]]; then
  docker logs "$container"
  exit 1
fi

binding="$(docker port "$container" 5432/tcp)"
port="${binding##*:}"
database_url="postgresql://postgres:postgres@127.0.0.1:${port}/${database}"

DATABASE_URL="$database_url" pnpm --filter @attendance/db db:migrate
TEST_DATABASE_URL="$database_url" pnpm --filter @attendance/db test:integration:run
DATABASE_URL="$database_url" pnpm --filter web test:integration
