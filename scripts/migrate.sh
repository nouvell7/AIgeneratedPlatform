#!/bin/bash

# Database Migration Script
set -e

echo "🚀 Starting database migration..."

# Check if environment is provided
if [ -z "$1" ]; then
    echo "❌ Environment not specified. Usage: ./migrate.sh [development|staging|production]"
    exit 1
fi

ENVIRONMENT=$1
echo "📝 Environment: $ENVIRONMENT"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env.$ENVIRONMENT"
else
    echo "❌ Environment file .env.$ENVIRONMENT not found"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in environment"
    exit 1
fi

echo "🔍 Checking database connection..."

# Wait for database to be ready
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if npx prisma db execute --file=/dev/null --schema=packages/backend/prisma/schema.prisma 2>/dev/null; then
        echo "✅ Database connection successful"
        break
    else
        echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Failed to connect to database after $max_attempts attempts"
    exit 1
fi

# Navigate to backend directory
cd packages/backend

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed database only in development
if [ "$ENVIRONMENT" = "development" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

echo "✅ Database migration completed successfully!"

# Return to root directory
cd ../..

echo "🎉 Migration script completed!"