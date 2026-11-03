#!/bin/sh
set -e

echo "=========================================="
echo "  Heirest Backend Container Startup"
echo "=========================================="

# Check if PostgreSQL is available
echo "⏳ Waiting for database connection..."
until nc -z -v -w 5 postgres 5432 > /dev/null 2>&1; do
  echo "   Waiting for postgres:5432..."
  sleep 2
done
echo "✅ PostgreSQL is reachable."

# Push Prisma schema to create/sync tables
echo "🔄 Synchronizing Prisma schema with database..."
npx prisma db push --skip-generate

# Seed initial data (upsert-safe)
if [ "${AUTO_SEED}" = "true" ]; then
  echo "🌱 Seeding catalog, admin credentials, and initial data..."
  if [ -f "dist/prisma/seed.js" ]; then
    node dist/prisma/seed.js || true
  else
    npx tsx prisma/seed.ts || true
  fi
  echo "✅ Database seeded."
fi

echo "🚀 Starting Express API server..."
exec "$@"
