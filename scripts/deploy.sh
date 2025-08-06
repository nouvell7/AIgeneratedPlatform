#!/bin/bash

# Deployment Script
set -e

echo "🚀 Starting deployment process..."

# Check if environment is provided
if [ -z "$1" ]; then
    echo "❌ Environment not specified. Usage: ./deploy.sh [development|staging|production]"
    exit 1
fi

ENVIRONMENT=$1
echo "📝 Environment: $ENVIRONMENT"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ Environment file .env.$ENVIRONMENT not found"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🔍 Checking Docker Compose configuration..."

# Use appropriate docker-compose file
if [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Docker Compose file $COMPOSE_FILE not found"
    exit 1
fi

echo "📦 Building Docker images..."

# Build images
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f $COMPOSE_FILE --profile production build --no-cache
else
    docker-compose -f $COMPOSE_FILE build --no-cache
fi

echo "🔄 Stopping existing containers..."

# Stop existing containers
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f $COMPOSE_FILE --profile production down
else
    docker-compose -f $COMPOSE_FILE down
fi

echo "🚀 Starting new containers..."

# Start containers
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f $COMPOSE_FILE --profile production up -d
else
    docker-compose -f $COMPOSE_FILE up -d
fi

echo "⏳ Waiting for services to be ready..."

# Wait for services to be healthy
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up (healthy)"; then
        echo "✅ Services are healthy"
        break
    else
        echo "⏳ Waiting for services to be healthy... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Services failed to become healthy after $max_attempts attempts"
    echo "📋 Container status:"
    docker-compose -f $COMPOSE_FILE ps
    echo "📋 Container logs:"
    docker-compose -f $COMPOSE_FILE logs --tail=50
    exit 1
fi

echo "🔄 Running database migrations..."

# Run migrations
./scripts/migrate.sh $ENVIRONMENT

echo "🧪 Running health checks..."

# Health check
if [ "$ENVIRONMENT" = "production" ]; then
    FRONTEND_URL="http://localhost"
    BACKEND_URL="http://localhost/api"
else
    FRONTEND_URL="http://localhost:3000"
    BACKEND_URL="http://localhost:3001"
fi

# Check frontend health
if curl -f "$FRONTEND_URL/health" > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
fi

# Check backend health
if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

echo "📋 Deployment summary:"
echo "Environment: $ENVIRONMENT"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Nginx URL: http://localhost"
fi

echo "📊 Container status:"
docker-compose -f $COMPOSE_FILE ps

echo "🎉 Deployment completed successfully!"

# Show logs for troubleshooting
echo "📋 Recent logs (last 20 lines):"
docker-compose -f $COMPOSE_FILE logs --tail=20