#!/bin/bash

# Production Deployment Script for Vercel + Railway
set -e

echo "🚀 Starting production deployment..."

# Check if required tools are installed
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI not installed. Run: npm i -g vercel"; exit 1; }
command -v railway >/dev/null 2>&1 || { echo "❌ Railway CLI not installed. Run: npm i -g @railway/cli"; exit 1; }

# Build and test locally first
echo "🔨 Building project locally..."
npm run build

echo "🧪 Running tests..."
npm run test

# Deploy backend to Railway
echo "🚂 Deploying backend to Railway..."
railway login
railway link
railway up --service backend

# Get Railway backend URL
BACKEND_URL=$(railway status --json | jq -r '.deployments[0].url')
echo "✅ Backend deployed to: $BACKEND_URL"

# Deploy frontend to Vercel
echo "⚡ Deploying frontend to Vercel..."
cd packages/frontend

# Set environment variables for Vercel
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_FRONTEND_URL production

# Deploy to Vercel
vercel --prod

echo "✅ Frontend deployed to Vercel"

# Run post-deployment health checks
echo "🏥 Running health checks..."

# Check backend health
if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check frontend health
FRONTEND_URL=$(vercel ls --scope=team | grep production | awk '{print $2}')
if curl -f "$FRONTEND_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

echo "🎉 Production deployment completed successfully!"
echo "🔗 Frontend URL: $FRONTEND_URL"
echo "🔗 Backend URL: $BACKEND_URL"