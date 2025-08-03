#!/bin/bash

echo "🚀 AI Service Platform 의존성 설치"
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 루트 의존성 설치
echo -e "${BLUE}📦 루트 의존성 설치 중...${NC}"
npm install --save-dev concurrently @types/node typescript

# 백엔드 의존성 설치
echo -e "${BLUE}📦 백엔드 의존성 설치 중...${NC}"
cd packages/backend

npm install \
  @prisma/client \
  express \
  cors \
  helmet \
  morgan \
  bcryptjs \
  jsonwebtoken \
  passport \
  passport-google-oauth20 \
  passport-github2 \
  passport-jwt \
  zod \
  winston \
  express-rate-limit \
  dotenv \
  axios

npm install --save-dev \
  @types/express \
  @types/cors \
  @types/morgan \
  @types/bcryptjs \
  @types/jsonwebtoken \
  @types/passport \
  @types/passport-google-oauth20 \
  @types/passport-github2 \
  @types/passport-jwt \
  @types/node \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  jest \
  @types/jest \
  ts-jest \
  supertest \
  @types/supertest \
  prisma \
  tsx \
  typescript

cd ../..

# 프론트엔드 의존성 설치
echo -e "${BLUE}📦 프론트엔드 의존성 설치 중...${NC}"
cd packages/frontend

npm install \
  next \
  react \
  react-dom \
  @reduxjs/toolkit \
  react-redux \
  axios \
  swr \
  @radix-ui/react-slot \
  @radix-ui/react-label \
  @radix-ui/react-tabs \
  class-variance-authority \
  clsx \
  tailwind-merge \
  tailwindcss-animate \
  lucide-react \
  recharts \
  react-hook-form \
  @hookform/resolvers \
  zod \
  date-fns

npm install --save-dev \
  @types/node \
  @types/react \
  @types/react-dom \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  autoprefixer \
  eslint \
  eslint-config-next \
  postcss \
  tailwindcss \
  typescript \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  jest-environment-jsdom

cd ../..

echo -e "${GREEN}✅ 모든 의존성 설치 완료!${NC}"