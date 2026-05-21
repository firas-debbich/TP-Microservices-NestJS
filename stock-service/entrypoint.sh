#!/bin/sh
echo "🔄 Running migrations..."
node node_modules/typeorm/cli.js migration:run -d dist/db/data-source.js
echo "🔄 Seeding database..."
node dist/seeds/seed.js
echo "🚀 Starting stock-service..."
node dist/main